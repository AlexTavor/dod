import dod.probe as probe
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
