import logging
import os

import pytest

from dod.config import Paths
from dod.registry import Registry
from dod.supervisor import Supervisor


@pytest.fixture(autouse=True)
def _reset_dod_logger():
    """Keep the process-global ``dod`` logger pristine between tests.

    ``configure_logging`` mutates a shared logger (handlers, level, propagate).
    Snapshot and restore it around every test so one test that configures logging
    cannot leak an open file handler — or a ``propagate=False`` that would starve
    ``caplog`` — into the next.
    """
    log = logging.getLogger("dod")
    saved_handlers, saved_level, saved_propagate = log.handlers[:], log.level, log.propagate
    yield
    for h in log.handlers:
        if h not in saved_handlers:
            h.close()
    log.handlers[:] = saved_handlers
    log.setLevel(saved_level)
    log.propagate = saved_propagate


@pytest.fixture
def paths(tmp_path):
    return Paths.create(tmp_path / "home").ensure()


@pytest.fixture
def registry(paths):
    return Registry(paths, providers=[])


class FakeProc:
    """Stand-in for subprocess.Popen with a controllable poll()."""
    def __init__(self, pid=999_999, returncode=None):
        self.pid = pid
        self._rc = returncode

    def poll(self):
        return self._rc

    def exit(self, code):
        self._rc = code


class Clock:
    """Deterministic, mutable clock for time-dependent state."""
    def __init__(self, t=1000.0):
        self.t = t

    def __call__(self):
        return self.t


@pytest.fixture
def fake_spawn():
    """A spawn that records calls and returns a live FakeProc."""
    calls = []

    def spawn(cmd, cwd, env, log_path):
        calls.append({"cmd": cmd, "cwd": cwd, "env": env, "log": log_path})
        return FakeProc()

    spawn.calls = calls
    return spawn


@pytest.fixture
def sup(paths, registry, fake_spawn):
    return Supervisor(paths, registry, spawn=fake_spawn, clock=Clock())


def write_registry(paths, entries):
    import json
    paths.registry.write_text(json.dumps({"entries": entries}), encoding="utf-8")


def write_local(paths, entries):
    import json
    paths.local.write_text(json.dumps({"entries": entries}), encoding="utf-8")


def entry(eid="d1", **kw):
    e = {"id": eid, "name": eid, "type": "web", "cmd": ["x"], "port": None,
         "ready": {"kind": "port"}, "stop": "sigterm", "singleton": True,
         "ready_timeout_s": 20, "tags": ["t"], "cwd": "."}
    e.update(kw)
    return e


def my_lockfile(sup, eid, port=None):
    """Write a lockfile owned by THIS process (so _owns() is True) — read-only, safe."""
    sup._write_lock(eid, os.getpid(), os.getpgid(os.getpid()), port, ["x"])
