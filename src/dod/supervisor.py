"""The process supervisor: spawn, stop, restart, reap, and compute liveness.

This is the part deck got *mostly* right and partly wrong. Carried over:
  - each child in its OWN session (start_new_session=True) so os.killpg takes down
    the whole `uv → python → …` tree atomically;
  - a per-child lockfile as the durable handle that survives a dod restart;
  - three liveness signals, never ps-by-name.

Fixed here (the "graveyard" defects):
  - DIE WITH DOD: shutdown() kills this session's children AND any inherited
    lockfile-owned survivors — and reap_on_boot() *re-adopts* live survivors (keeps
    their lockfile) so the next shutdown kills them too. Ownership no longer evaporates
    on restart.
  - VERIFIED STOP: stop()/restart() wait for the port to actually release and escalate
    to SIGKILL before claiming success — no more "stopped" that's still listening.
  - DURABLE CRASH MARKER: an observed exit (or a death while dod was down) is recorded
    to disk, so a crash stays "crashed" across a dod restart instead of degrading to
    a clean-looking "stopped".
"""
from __future__ import annotations

import contextlib
import logging
import os
import signal
import subprocess
import threading
import time
from collections.abc import Callable
from pathlib import Path
from typing import Protocol, cast

from . import probe as net
from .config import LOG_CAP, Paths
from .models import ActionResult, CrashMark, Entry, Lockfile, State, StopReason
from .registry import Registry
from .util import load_json, write_json

logger = logging.getLogger(__name__)


class ProcHandle(Protocol):
    """The slice of ``subprocess.Popen`` the supervisor depends on, so an injected fake
    (tests) and a real Popen both satisfy it structurally."""

    pid: int

    def poll(self) -> int | None: ...


def _default_spawn(cmd: list[str], cwd: str | None, env: dict[str, str] | None,
                   log_path: Path | None) -> ProcHandle:
    """Real subprocess spawn. Injectable so tests can run without real processes."""
    if log_path is not None:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        logf = log_path.open("ab")  # fd is dup'd into the child, then closed in the finally below
        if logf.tell() > LOG_CAP:
            logf.truncate(0)
            logf.seek(0)
        try:
            p = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=logf,
                                 stderr=subprocess.STDOUT, start_new_session=True)
        finally:
            logf.close()        # child holds its own dup'd fd; free the parent's
        return p
    return subprocess.Popen(cmd, cwd=cwd, env=env, start_new_session=True)


# Detailed states that mean "something is running" — projected to status="live".
LIVE_STATES = frozenset({"ready", "external", "starting", "unhealthy", "launched", "running"})


def _is_marker(name: str) -> bool:
    """A run-dir file that is NOT a child lockfile (crash/clean-stop reason markers)."""
    return name.endswith((".crash.json", ".stop.json"))


def pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, ValueError):
        return False
    except PermissionError:
        return True


class Supervisor:
    def __init__(self, paths: Paths, registry: Registry,
                 spawn: Callable[..., ProcHandle] | None = None,
                 clock: Callable[[], float] = time.time) -> None:
        self.paths = paths
        self.registry = registry
        self._spawn = spawn or _default_spawn
        self.clock = clock
        self.lock = threading.Lock()
        self.procs: dict[str, ProcHandle] = {}    # children THIS dod launched this session
        self.started_at: dict[str, float] = {}

    # ── lockfiles + crash markers ───────────────────────────────────────
    def _read_lock(self, eid: str) -> Lockfile | None:
        try:
            lf = load_json(self.paths.lock(eid))
        except Exception:  # noqa: BLE001
            return None
        return cast(Lockfile, lf) if lf else None

    def _write_lock(self, eid: str, pid: int, pgid: int | None, port: int | None,
                    cmd: list[str]) -> None:
        write_json(self.paths.lock(eid),
                   {"pid": pid, "pgid": pgid, "port": port, "cmd": cmd, "started_at": self.clock()})

    def _write_crash(self, eid: str, exit_code: int | None, note: str = "") -> None:
        write_json(self.paths.crash(eid), {"exit": exit_code, "at": self.clock(), "note": note})

    def _read_crash(self, eid: str) -> CrashMark | None:
        c = load_json(self.paths.crash(eid))
        return cast(CrashMark, c) if c else None

    def _clear_crash(self, eid: str) -> None:
        self.paths.crash(eid).unlink(missing_ok=True)

    def _write_stop(self, eid: str) -> None:
        write_json(self.paths.stopmark(eid), {"kind": "clean", "at": self.clock()})

    def _clear_marks(self, eid: str) -> None:
        self.paths.crash(eid).unlink(missing_ok=True)
        self.paths.stopmark(eid).unlink(missing_ok=True)

    def _owns(self, lf: Lockfile | None) -> bool:
        """True only if the lockfile's pid is alive AND still in its recorded process
        group — the pgid check defeats pid-reuse faking a live child after a restart."""
        if not lf:
            return False
        pid, pgid = lf.get("pid"), lf.get("pgid")
        if not pid or pid <= 0 or not pid_alive(pid):
            return False
        if pgid:
            try:
                return os.getpgid(pid) == pgid
            except (ProcessLookupError, PermissionError):
                return False
        return True

    # ── start / stop / restart ──────────────────────────────────────────
    def start(self, e: Entry) -> ActionResult:
        eid = e["id"]
        cwd = self.registry.resolve_cwd(e)
        self._clear_marks(eid)                 # a fresh start clears any prior crash/stop reason
        if e["type"] == "terminal":
            try:
                self._spawn(e["cmd"], cwd, None, None)
            except Exception as ex:  # noqa: BLE001
                return {"ok": False, "error": f"launch failed: {ex}"}
            self.started_at[eid] = self.clock()
            self._write_lock(eid, -1, None, None, e["cmd"])   # launch record only
            return {"ok": True, "state": "launched"}

        existing = self.procs.get(eid)        # guard the double-spawn race (two fast Starts → EADDRINUSE)
        if existing is not None and existing.poll() is None:
            return {"ok": True, "state": "starting", "note": "already starting"}

        port = e.get("port")
        if port and net.port_open(int(port)):
            ok, _, _ = net.probe(int(port), e.get("ready", {}))
            if ok:
                return {"ok": True, "state": "running", "note": "already up — focusing"}
            if e.get("singleton", True):
                return {"ok": False, "error": "port-busy-foreign",
                        "detail": f"port {port} is held by something not answering as this dashboard"}
        env = {**os.environ, **{str(k): str(v) for k, v in (e.get("env") or {}).items()}}
        try:
            p = self._spawn(e["cmd"], cwd, env, self.paths.log(eid))
        except Exception as ex:  # noqa: BLE001
            return {"ok": False, "error": f"launch failed: {ex}"}
        with self.lock:
            self.procs[eid] = p
            self.started_at[eid] = self.clock()
        try:
            pgid = os.getpgid(p.pid)
        except Exception:  # noqa: BLE001
            pgid = None
        self._write_lock(eid, p.pid, pgid, port, e["cmd"])
        return {"ok": True, "state": "starting"}

    @staticmethod
    def _killpg(pgid: int | None, hard: bool = False) -> None:
        if not pgid or pgid <= 1:
            return
        with contextlib.suppress(ProcessLookupError, PermissionError):
            os.killpg(pgid, signal.SIGKILL if hard else signal.SIGTERM)

    def _wait_port_closed(self, port: int, timeout: float) -> bool:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if not net.port_open(int(port)):
                return True
            time.sleep(0.1)
        return not net.port_open(int(port))

    def stop(self, e: Entry) -> ActionResult:
        eid = e["id"]
        lf = self._read_lock(eid)
        if e.get("stop") == "leave" and eid not in self.procs:
            return {"ok": False, "error": "external — dod did not launch this; stop it yourself"}
        if not lf and eid not in self.procs:
            return {"ok": False, "error": "not running under dod"}
        p = self.procs.get(eid)
        if p and p.poll() is not None:          # already exited — reap, don't signal a dead pgid
            with self.lock:
                self.procs.pop(eid, None)
            self._clear_marks(eid)
            self._write_stop(eid)               # intentional stop → reason is clean
            self.paths.lock(eid).unlink(missing_ok=True)
            return {"ok": True}
        pgid = None
        if p:
            try:
                pgid = os.getpgid(p.pid)
            except Exception:  # noqa: BLE001
                pgid = (lf or {}).get("pgid")
        else:
            pgid = (lf or {}).get("pgid")
        self._killpg(pgid)
        if e.get("stop") == "sigterm-then-kill":
            time.sleep(1.5)
            self._killpg(pgid, hard=True)
        # VERIFY the socket actually released before claiming success — escalate once.
        port = e.get("port")
        if port and not self._wait_port_closed(int(port), timeout=4.0):
            self._killpg(pgid, hard=True)
            if not self._wait_port_closed(int(port), timeout=2.0):
                return {
                    "ok": False,
                    "error": f"port {port} still bound after stop",
                    "detail": "process did not release the socket; it may have escaped its process group",
                }
        with self.lock:
            self.procs.pop(eid, None)
        self._clear_marks(eid)
        self._write_stop(eid)                   # clean stop → durable reason
        self.paths.lock(eid).unlink(missing_ok=True)
        return {"ok": True}

    def restart(self, e: Entry) -> ActionResult:
        res = self.stop(e)
        if not res.get("ok") and not str(res.get("error", "")).startswith("not running"):
            return cast(ActionResult, {"ok": False, "error": f"restart aborted: {res.get('error')}",
                                       "detail": res.get("detail")})
        port = e.get("port")
        if port:
            self._wait_port_closed(int(port), timeout=3.0)
        return self.start(e)

    # ── boot reconciliation + shutdown ──────────────────────────────────
    def reap_on_boot(self) -> None:
        """Reconcile prior-run lockfiles against reality. Live survivors are RE-ADOPTED
        (lockfile kept, so shutdown() will kill them); dead ones get a crash marker
        (so the death isn't silently downgraded to 'stopped') and are cleared."""
        if not self.paths.run.exists():
            return
        for lp in self.paths.run.glob("*.json"):
            if _is_marker(lp.name):
                continue
            eid = lp.stem
            lf = self._read_lock(eid)
            if not lf:
                lp.unlink(missing_ok=True)
                continue
            port = lf.get("port")
            alive = self._owns(lf) and (not port or net.port_open(int(port)))
            if alive:
                logger.info("re-adopted %s (pid %s) — will die with dod", eid, lf.get("pid"))
                continue
            if lf.get("pid", 0) and lf["pid"] > 0 and not self.paths.crash(eid).exists():
                self._write_crash(eid, None, note="exited while dod was down")
            lp.unlink(missing_ok=True)
            logger.info("reaped stale lockfile %s", eid)

    def shutdown(self) -> None:
        """Kill everything dod owns — this session's children AND inherited survivors.
        This is what makes 'die with dod' actually hold."""
        killed = set()
        for eid, p in list(self.procs.items()):
            with contextlib.suppress(Exception):  # group may already be reaped
                self._killpg(os.getpgid(p.pid))
            killed.add(eid)
            self.paths.lock(eid).unlink(missing_ok=True)
        if self.paths.run.exists():
            for lp in self.paths.run.glob("*.json"):
                if _is_marker(lp.name):
                    continue
                eid = lp.stem
                if eid in killed:
                    continue
                lf = self._read_lock(eid)
                if lf and self._owns(lf):
                    self._killpg(lf.get("pgid"))
                    lp.unlink(missing_ok=True)

    # ── liveness ────────────────────────────────────────────────────────
    def state(self, e: Entry) -> State:
        """The detailed state, projected to the user-facing model: a top-level
        ``status`` (live|stopped) and a ``last_stop_reason`` (clean | crash+exit | …)."""
        r = self._state_raw(e)
        st = r["state"]
        if st in LIVE_STATES:
            r["status"], r["last_stop_reason"] = "live", None
        else:
            r["status"] = "stopped"
            r["last_stop_reason"] = self._stop_reason(e["id"], st, r.get("exit"))
        return r

    def _stop_reason(self, eid: str, st: str, exit_code: int | None) -> StopReason | None:
        if st == "crashed":
            return StopReason(kind="crash", exit=exit_code)
        if st == "port-busy-foreign":
            return StopReason(kind="port-busy")
        if st == "archived":
            return None
        # st == "stopped": _state_raw already routed real crashes to "crashed", so a
        # surviving stop marker means a deliberate stop; otherwise it never ran.
        return StopReason(kind="clean") if self.paths.stopmark(eid).exists() else None

    def _state_raw(self, e: Entry) -> State:
        eid = e["id"]
        base: dict[str, object] = {"id": eid, "name": e.get("name", eid), "blurb": e.get("blurb", ""),
                "why": e.get("why", ""), "tags": e.get("tags", []), "type": e["type"],
                "port": e.get("port"), "cmd": e.get("cmd", []),
                "source": e.get("source", "registry"), "provider": e.get("provider"),
                "stop": e.get("stop"), "embeddable": True, "controllable": False,
                "log_tail": "", "render": "iframe"}

        def done(**kw: object) -> State:
            return cast(State, {**base, **kw})

        if e.get("state_override") == "archived":
            return done(state="archived")
        lf = self._read_lock(eid)
        owned = eid in self.procs

        if e["type"] == "terminal":
            st = "launched" if lf else "stopped"
            if lf and lf.get("started_at"):
                base["launched_at"] = lf["started_at"]
            return done(state=st, controllable=False)

        port = e.get("port")
        ok, embeddable, _ = (net.probe(int(port), e.get("ready", {})) if port else (False, True, None))
        base["embeddable"] = embeddable
        mine = owned or self._owns(lf)
        base["controllable"] = mine

        if owned and self.procs[eid].poll() is not None:   # owned-but-exited → crashed
            rc = self.procs[eid].poll()
            if not self.paths.crash(eid).exists():
                self._write_crash(eid, rc)
            base["log_tail"] = net.log_tail(self.paths.log(eid))
            return done(state="crashed", exit=rc)

        if ok:
            meta = net.fetch_meta(int(port)) if port else None
            if meta:
                base["render"] = "spec" if meta.get("render") == "spec" else "iframe"
                if meta.get("name"):
                    base["name"] = meta["name"]
                if meta.get("blurb"):
                    base["blurb"] = meta["blurb"]
                if meta.get("why"):
                    base["why"] = meta["why"]
            if mine:
                self._clear_crash(eid)                     # healthy again — drop any stale crash
                return done(state="ready")
            return done(state="external", controllable=False)

        # not answering
        crash = self._read_crash(eid)
        if crash and not mine:           # a recorded death that survived a dod restart
            base["log_tail"] = net.log_tail(self.paths.log(eid))
            return done(state="crashed", exit=crash.get("exit"), crash_note=crash.get("note", ""))
        if mine:
            started = self.started_at.get(eid) or (lf or {}).get("started_at") or 0
            within = (self.clock() - started) < e.get("ready_timeout_s", 20)
            base["log_tail"] = net.log_tail(self.paths.log(eid))
            return done(state="starting" if within else "unhealthy")
        if port and net.port_open(int(port)):
            return done(state="port-busy-foreign", controllable=False)
        return done(state="stopped", log_tail=net.log_tail(self.paths.log(eid)))
