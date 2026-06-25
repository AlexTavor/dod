"""Property tests for the manifest_to_entry seam.

Properties are sourced from the manifest schema + the design in ``manifest.py``: a project
declares itself with an ``id`` and ``name`` plus an optional ``run`` block, and a manifest with
no real ``run.cmd`` (an argv list) is adopt-only. A well-formed manifest must yield a complete,
internally consistent registry entry; a missing id/name must yield nothing.
"""
import json
from pathlib import Path

from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from dod.providers.manifest import MANIFEST, manifest_to_entry

_run = st.fixed_dictionaries({}, optional={
    "cmd": st.one_of(st.none(),
                     st.lists(st.text(min_size=1, max_size=6), max_size=4),   # a valid argv list
                     st.text(max_size=10)),                                   # malformed: a shell string
    "cwd": st.text(alphabet="abcdefABCDEF0123456789-_./", max_size=12),
    "port": st.one_of(st.none(), st.integers(min_value=1, max_value=65535)),
    "stop": st.sampled_from(["sigterm", "leave", "sigterm-then-kill"]),
    "ready_timeout_s": st.integers(min_value=1, max_value=120),
    "env": st.dictionaries(st.text(min_size=1, max_size=4), st.text(max_size=6), max_size=3),
})

REQUIRED = {"id", "name", "blurb", "why", "tags", "type", "cmd", "cwd", "env",
            "port", "ready", "ready_timeout_s", "stop", "singleton"}


def _write(tmp_path, manifest):
    d = tmp_path / "proj"
    d.mkdir(parents=True, exist_ok=True)
    p = d / MANIFEST
    p.write_text(json.dumps(manifest), encoding="utf-8")
    return p


@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(mid=st.text(min_size=1, max_size=12), name=st.text(min_size=1, max_size=12), run=_run,
       tags=st.lists(st.text(max_size=6), max_size=4), desc=st.text(max_size=20))
def test_well_formed_manifest_yields_a_complete_consistent_entry(tmp_path, mid, name, run, tags, desc):
    e = manifest_to_entry(_write(tmp_path, {"id": mid, "name": name, "run": run,
                                            "tags": tags, "description": desc}))
    assert e is not None
    assert set(e) >= REQUIRED                                  # every entry key is present
    assert e["id"] == mid and e["name"] == name
    assert e["type"] in ("web", "web-external")
    assert isinstance(e["cmd"], list)
    launchable = isinstance(run.get("cmd"), list) and bool(run["cmd"])
    assert (e["type"] == "web") == launchable                  # web iff it has a real argv cmd
    assert (e["cmd"] != []) == launchable                      # cmd non-empty iff launchable
    assert Path(e["cwd"]).is_absolute()                        # cwd is always resolved to absolute
    if not run.get("stop"):
        assert e["stop"] == ("sigterm" if launchable else "leave")  # adopt-only defaults to leave


@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(mid=st.one_of(st.none(), st.just(""), st.text(min_size=1, max_size=8)),
       name=st.one_of(st.none(), st.just(""), st.text(min_size=1, max_size=8)))
def test_entry_is_none_exactly_when_id_or_name_is_missing(tmp_path, mid, name):
    manifest = {}
    if mid is not None:
        manifest["id"] = mid
    if name is not None:
        manifest["name"] = name
    e = manifest_to_entry(_write(tmp_path, manifest))
    assert (e is None) == (not mid or not name)                # None iff id or name is falsy
