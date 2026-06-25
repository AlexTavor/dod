import json

from dod.providers.manifest import (
    MANIFEST,
    ManifestProvider,
    find_manifests,
    manifest_to_entry,
)


def _write(d, obj):
    d.mkdir(parents=True, exist_ok=True)
    (d / MANIFEST).write_text(json.dumps(obj))
    return d / MANIFEST


def test_find_manifests_prunes_node_modules(tmp_path):
    _write(tmp_path / "proj", {"id": "a", "name": "A"})
    _write(tmp_path / "node_modules" / "x", {"id": "b", "name": "B"})
    found = find_manifests([tmp_path])
    assert any("proj" in str(p) for p in found)
    assert not any("node_modules" in str(p) for p in found)


def test_manifest_to_entry_full(tmp_path):
    m = _write(tmp_path / "jobs", {
        "id": "jobs", "name": "Jobs", "description": "the board",
        "run": {"cmd": ["node", "s.js"], "port": 4317,
                "ready": {"kind": "http", "path": "/", "status": 200}},
        "tags": ["tools"]})
    e = manifest_to_entry(m)
    assert e["id"] == "jobs" and e["type"] == "web" and e["port"] == 4317
    assert e["cwd"] == str(tmp_path / "jobs")        # relative "." → manifest dir
    assert e["blurb"] == "the board" and e["tags"] == ["tools"]


def test_manifest_absolute_cwd_kept(tmp_path):
    m = _write(tmp_path / "p", {"id": "p", "name": "P", "run": {"cmd": ["x"], "cwd": "/abs/here"}})
    assert manifest_to_entry(m)["cwd"] == "/abs/here"


def test_manifest_no_run_is_adopt_only(tmp_path):
    m = _write(tmp_path / "p", {"id": "p", "name": "P"})
    e = manifest_to_entry(m)
    assert e["type"] == "web-external" and e["cmd"] == [] and e["stop"] == "leave"


def test_manifest_string_cmd_is_treated_as_adopt_only(tmp_path):
    # a non-list cmd (e.g. a shell string) is not a valid argv, so it is no cmd: the entry is
    # adopt-only (web-external), not a "web" entry that claims to launch but has an empty cmd.
    m = _write(tmp_path / "p", {"id": "p", "name": "P", "run": {"cmd": "node s.js"}})
    e = manifest_to_entry(m)
    assert e["type"] == "web-external" and e["cmd"] == [] and e["stop"] == "leave"


def test_manifest_missing_id_skipped(tmp_path):
    assert manifest_to_entry(_write(tmp_path / "p", {"name": "no id"})) is None


def test_discover_disabled(tmp_path, paths):
    assert ManifestProvider({"enabled": False}).discover(paths) == []


def test_discover_finds_and_caches(tmp_path, paths):
    calls = []

    def finder(roots, depth):
        calls.append(1)
        return [_write(tmp_path / "p", {"id": "p", "name": "P", "run": {"cmd": ["x"], "port": 9}})]

    prov = ManifestProvider({"enabled": True, "roots": [str(tmp_path)]}, finder=finder)
    e = prov.discover(paths)
    assert len(e) == 1 and e[0]["id"] == "p"
    prov.discover(paths)
    assert len(calls) == 1                            # second call served from cache
