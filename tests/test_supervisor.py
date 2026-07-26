import os
import threading

import dod.probe as probe
from dod.supervisor import PROBE_MISSES
from tests.conftest import FakeProc, entry, my_lockfile


# ── start ───────────────────────────────────────────────────────────────
def test_start_web_records_lockfile_and_clears_crash(sup, paths, fake_spawn):
    sup._write_crash("d1", 1)
    res = sup.start(entry("d1", port=None))
    assert res["state"] == "starting"
    assert "d1" in sup.procs
    assert paths.lock("d1").exists()
    assert not paths.crash("d1").exists()
    assert len(fake_spawn.calls) == 1


def test_start_guard_blocks_double_spawn(sup, fake_spawn):
    sup.procs["d1"] = FakeProc()                 # already starting (poll() is None)
    res = sup.start(entry("d1", port=None))
    assert res.get("note") == "already starting"
    assert len(fake_spawn.calls) == 0            # did not spawn a second instance (the EADDRINUSE cause)


def test_start_terminal_is_launch_record_only(sup, paths):
    res = sup.start(entry("t1", type="terminal", cmd=["echo", "hi"]))
    assert res["state"] == "launched"
    lf = sup._read_lock("t1")
    assert lf["pid"] == -1 and lf["pgid"] is None


def test_start_already_up_focuses_without_spawn(sup, fake_spawn, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: True)
    monkeypatch.setattr(probe, "probe", lambda p, r: (True, True, 200))
    res = sup.start(entry("d1", port=8077))
    assert res["state"] == "running"
    assert len(fake_spawn.calls) == 0


def test_start_refuses_port_busy_foreign(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: True)
    monkeypatch.setattr(probe, "probe", lambda p, r: (False, True, 500))
    res = sup.start(entry("d1", port=8077, singleton=True))
    assert res["ok"] is False and res["error"] == "port-busy-foreign"


# ── stop ────────────────────────────────────────────────────────────────
def test_stop_not_running(sup):
    assert sup.stop(entry("d1", port=None))["error"] == "not running under dod"


def test_stop_external_refused(sup):
    res = sup.stop(entry("d1", stop="leave"))
    assert res["ok"] is False and "external" in res["error"]


def test_stop_owned_already_exited_is_reaped(sup, paths):
    sup.procs["d1"] = FakeProc(returncode=0)
    my_lockfile(sup, "d1")
    res = sup.stop(entry("d1", port=None))
    assert res["ok"] is True
    assert "d1" not in sup.procs and not paths.lock("d1").exists()


def test_stop_succeeds_when_port_released(sup, paths, monkeypatch):
    sup.procs["d1"] = FakeProc()
    my_lockfile(sup, "d1", port=8077)
    monkeypatch.setattr(sup, "_killpg", lambda *a, **k: None)
    monkeypatch.setattr(sup, "_wait_port_closed", lambda *a, **k: True)
    res = sup.stop(entry("d1", port=8077))
    assert res["ok"] is True and not paths.lock("d1").exists()


def test_stop_reports_still_bound_and_keeps_lockfile(sup, paths, monkeypatch):
    sup.procs["d1"] = FakeProc()
    my_lockfile(sup, "d1", port=8077)
    monkeypatch.setattr(sup, "_killpg", lambda *a, **k: None)
    monkeypatch.setattr(sup, "_wait_port_closed", lambda *a, **k: False)
    res = sup.stop(entry("d1", port=8077))
    assert res["ok"] is False and "still bound" in res["error"]
    assert paths.lock("d1").exists()        # honest: not cleared while still listening


# ── boot reconciliation + shutdown ──────────────────────────────────────
def test_reap_on_boot_keeps_live_marks_dead(sup, paths):
    my_lockfile(sup, "live")                       # owned by this process → alive
    sup._write_lock("dead", 999_999, 999_999, None, ["x"])   # dead pid
    sup.reap_on_boot()
    assert paths.lock("live").exists()
    assert not paths.lock("dead").exists()
    assert paths.crash("dead").exists()            # death recorded, not silently dropped


def test_shutdown_kills_owned_and_inherited(sup, paths, monkeypatch):
    killed = []
    monkeypatch.setattr(sup, "_killpg", lambda pgid, hard=False: killed.append(pgid))
    sup.procs["a"] = FakeProc(pid=999_999)
    sup._write_lock("a", 999_999, None, None, ["x"])
    my_lockfile(sup, "b")                           # inherited survivor owned by us
    sup.shutdown()
    assert not paths.lock("a").exists() and not paths.lock("b").exists()
    assert killed                                    # inherited child's group was signalled


# ── liveness state machine ──────────────────────────────────────────────
def test_state_archived(sup):
    assert sup.state(entry("d1", state_override="archived"))["state"] == "archived"


def test_state_terminal(sup):
    assert sup.state(entry("t1", type="terminal"))["state"] == "stopped"
    my_lockfile(sup, "t1")
    assert sup.state(entry("t1", type="terminal"))["state"] == "launched"


def test_state_crashed_on_owned_exit(sup, paths):
    sup.procs["d1"] = FakeProc(returncode=2)
    st = sup.state(entry("d1", port=None))
    assert st["state"] == "crashed" and st["exit"] == 2
    assert paths.crash("d1").exists()


def test_state_ready_clears_crash(sup, paths, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: True)
    monkeypatch.setattr(probe, "probe", lambda p, r: (True, True, 200))
    monkeypatch.setattr(probe, "fetch_meta", lambda p: None)
    my_lockfile(sup, "d1", port=8077)
    sup._write_crash("d1", 1)
    st = sup.state(entry("d1", port=8077))
    assert st["state"] == "ready" and st["controllable"] is True
    assert not paths.crash("d1").exists()


def test_state_external_when_not_ours(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: True)
    monkeypatch.setattr(probe, "probe", lambda p, r: (True, True, 200))
    monkeypatch.setattr(probe, "fetch_meta", lambda p: None)
    st = sup.state(entry("d1", port=8077))
    assert st["state"] == "external" and st["controllable"] is False


def test_state_starting_then_unhealthy_at_timeout_boundary(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: False)
    my_lockfile(sup, "d1")                 # started_at == clock() == 1000.0
    e = entry("d1", port=None, ready_timeout_s=20)
    sup.clock.t = 1019.0
    assert sup.state(e)["state"] == "starting"
    sup.clock.t = 1020.0                   # boundary: elapsed == timeout → unhealthy
    assert sup.state(e)["state"] == "unhealthy"


# ── probe miss budget: one bad sample must not rewrite the board ────────
class Child:
    """A child whose probe and /api/meta answers can be flipped mid-test."""

    def __init__(self, sup, monkeypatch, up=True, meta=None):
        self.up, self.meta = up, meta
        monkeypatch.setattr(probe, "port_open", lambda p: True)
        monkeypatch.setattr(probe, "probe", lambda p, r: (self.up, True, 200 if self.up else None))
        monkeypatch.setattr(probe, "fetch_meta", lambda p: self.meta)


def _live_spec_child(sup, monkeypatch, **kw):
    """A dod-owned entry that has answered once, with its ready window already closed —
    the state from which a miss is a hiccup rather than a slow start."""
    child = Child(sup, monkeypatch, **kw)
    my_lockfile(sup, "d1", port=8077)
    e = entry("d1", port=8077, ready_timeout_s=20)
    assert sup.state(e)["state"] == "ready"       # serves once: this is what earns the budget
    sup.clock.t += 100                            # past ready_timeout: no longer "starting"
    child.up = False
    return child, e


def test_misses_below_the_budget_keep_it_ready(sup, monkeypatch):
    """PROBE_MISSES - 1 consecutive misses: still ready.

    Pairs with the boundary test below to pin `<` rather than `<=`; a `<=` would hold the
    dashboard ready for one miss longer than the budget allows.
    """
    _, e = _live_spec_child(sup, monkeypatch)
    for _ in range(PROBE_MISSES - 1):
        assert sup.state(e)["state"] == "ready"


def test_the_budget_th_miss_is_unhealthy(sup, monkeypatch):
    """Exactly PROBE_MISSES consecutive misses → unhealthy. The boundary case."""
    _, e = _live_spec_child(sup, monkeypatch)
    for _ in range(PROBE_MISSES - 1):
        sup.state(e)
    assert sup.state(e)["state"] == "unhealthy"


def test_the_budget_counts_only_consecutive_misses(sup, monkeypatch):
    """One good probe resets it: misses either side of a success never add up to a verdict."""
    child, e = _live_spec_child(sup, monkeypatch)
    for _ in range(PROBE_MISSES - 1):
        sup.state(e)
    child.up = True
    assert sup.state(e)["state"] == "ready"
    child.up = False
    for _ in range(PROBE_MISSES - 1):             # a full budget short of a verdict again
        assert sup.state(e)["state"] == "ready"


def test_a_child_that_never_served_is_unhealthy_on_the_first_miss(sup, monkeypatch):
    """The budget is only for a child that HAS answered. One that never came up inside its
    ready window must not be granted PROBE_MISSES ticks of borrowed health."""
    Child(sup, monkeypatch, up=False)
    my_lockfile(sup, "d1", port=8077)
    e = entry("d1", port=8077, ready_timeout_s=20)
    sup.clock.t += 100                            # ready window closed, never answered
    assert sup.state(e)["state"] == "unhealthy"


def test_restarting_forgets_the_previous_process_budget(sup, monkeypatch, fake_spawn):
    """A restarted child re-earns its budget instead of inheriting the last process's."""
    _, e = _live_spec_child(sup, monkeypatch)
    sup.state(e)                                  # one miss banked against the old process
    sup.start(e)
    sup.clock.t += 100
    assert sup.state(e)["state"] == "unhealthy"   # never served since start → no budget


# ── contract memory: a missed sniff must not swap the pane ──────────────
SPEC_META = {"contract": "dod-kit/1", "render": "spec", "name": "plan"}


def test_missed_meta_sniff_keeps_the_spec_render(sup, monkeypatch):
    """/api/meta is a SECOND request after the probe, so it can miss on its own. That used
    to leave render at its "iframe" default, swapping a native dashboard for an iframe of
    the child's standalone shim for one tick."""
    child = Child(sup, monkeypatch, meta=SPEC_META)
    my_lockfile(sup, "d1", port=8077)
    e = entry("d1", port=8077)
    assert sup.state(e)["render"] == "spec"
    child.meta = None                             # the sniff misses; the probe still answers
    assert sup.state(e)["render"] == "spec"


def test_missed_probe_within_budget_keeps_the_spec_render(sup, monkeypatch):
    """A tick inside the miss budget reports the pane it had, not a bare default."""
    _, e = _live_spec_child(sup, monkeypatch, meta=SPEC_META)
    st = sup.state(e)
    assert (st["state"], st["render"]) == ("ready", "spec")


def test_a_child_that_never_announced_a_contract_stays_an_iframe(sup, monkeypatch):
    """No-op path: no meta was ever seen, so there is nothing to remember and the default
    stands. The memory must not invent a spec dashboard out of a silent child."""
    Child(sup, monkeypatch, meta=None)
    my_lockfile(sup, "d1", port=8077)
    assert sup.state(entry("d1", port=8077))["render"] == "iframe"


def test_state_crashed_survives_restart(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: False)
    sup._write_crash("d1", 7)              # recorded death, no live proc/lockfile
    st = sup.state(entry("d1", port=None))
    assert st["state"] == "crashed" and st["exit"] == 7


def test_state_port_busy_foreign(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: True)
    monkeypatch.setattr(probe, "probe", lambda p, r: (False, True, None))
    assert sup.state(entry("d1", port=8077))["state"] == "port-busy-foreign"


def test_state_stopped(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: False)
    monkeypatch.setattr(probe, "probe", lambda p, r: (False, True, None))   # hermetic: no real socket
    assert sup.state(entry("d1", port=8077))["state"] == "stopped"


# ── status model: live | stopped + last_stop_reason ─────────────────────
def test_status_live_has_no_stop_reason(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: True)
    monkeypatch.setattr(probe, "probe", lambda p, r: (True, True, 200))
    monkeypatch.setattr(probe, "fetch_meta", lambda p: None)
    my_lockfile(sup, "d1", port=8077)
    st = sup.state(entry("d1", port=8077))
    assert st["status"] == "live" and st["last_stop_reason"] is None


def test_status_clean_stop_reason(sup, monkeypatch):
    sup.procs["d1"] = FakeProc()
    my_lockfile(sup, "d1", port=None)
    monkeypatch.setattr(sup, "_killpg", lambda *a, **k: None)
    assert sup.stop(entry("d1", port=None))["ok"] is True
    monkeypatch.setattr(probe, "port_open", lambda p: False)
    st = sup.state(entry("d1", port=None))
    assert st["state"] == "stopped" and st["status"] == "stopped"
    assert st["last_stop_reason"] == {"kind": "clean"}


def test_status_crash_reason(sup):
    sup.procs["d1"] = FakeProc(returncode=3)
    st = sup.state(entry("d1", port=None))
    assert st["state"] == "crashed" and st["status"] == "stopped"
    assert st["last_stop_reason"]["kind"] == "crash" and st["last_stop_reason"]["exit"] == 3


def test_never_started_has_no_reason(sup, monkeypatch):
    monkeypatch.setattr(probe, "port_open", lambda p: False)
    monkeypatch.setattr(probe, "probe", lambda p, r: (False, True, None))
    st = sup.state(entry("d1", port=8077))
    assert st["status"] == "stopped" and st["last_stop_reason"] is None


def test_start_clears_stop_mark(sup, paths):
    sup._write_stop("d1")
    assert paths.stopmark("d1").exists()
    sup.start(entry("d1", port=None))
    assert not paths.stopmark("d1").exists()


def test_reap_keeps_markers(sup, paths):
    sup._write_stop("d1")
    sup.reap_on_boot()                       # markers are not lockfiles → must survive
    assert paths.stopmark("d1").exists()


# ── atlas risk-register regressions (R1, R2) ────────────────────────────
def test_start_pgid_falls_back_to_pid_when_getpgid_fails(sup, monkeypatch):
    # R2: if getpgid raises right after spawn, the lockfile must record the child's pid as
    # the group id (start_new_session makes pid == pgid), never None — else _killpg no-ops
    # and stop/shutdown orphan the tree.
    def boom(_pid):
        raise ProcessLookupError("no such process")
    monkeypatch.setattr(os, "getpgid", boom)
    assert sup.start(entry("d1", port=None))["state"] == "starting"
    lf = sup._read_lock("d1")
    assert lf["pgid"] is not None and lf["pgid"] == lf["pid"]


def test_state_raw_is_race_safe_under_concurrent_stop(sup, monkeypatch):
    # R1: _state_raw snapshots self.procs under the lock. Before the fix, a concurrent stop()
    # popping the entry between the membership check and `self.procs[eid].poll()` raised KeyError
    # out of the sampler. Drive that interleave hard; no exception may escape.
    monkeypatch.setattr(probe, "port_open", lambda p: False)
    monkeypatch.setattr(probe, "probe", lambda p, r: (False, True, None))
    e = entry("d1", port=8077)
    errors: list[Exception] = []
    stop = threading.Event()

    def reader() -> None:
        while not stop.is_set():
            try:
                sup._state_raw(e)
            except Exception as ex:  # noqa: BLE001 — capturing any escape is the point
                errors.append(ex)

    def churn() -> None:
        for _ in range(4000):
            with sup.lock:
                sup.procs["d1"] = FakeProc(returncode=0)
            with sup.lock:
                sup.procs.pop("d1", None)
        stop.set()

    threads = [threading.Thread(target=reader), threading.Thread(target=churn)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors, errors[:3]
