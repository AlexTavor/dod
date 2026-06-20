from pathlib import Path

from dod.providers.pdd import PddProvider, find_pdd_repos


def _make_pdd_repo(root: Path, name: str, marker="config.yaml"):
    d = root / name
    (d / ".pdd").mkdir(parents=True)
    (d / ".pdd" / marker).write_text("x")
    return d


def test_find_pdd_repos_finds_and_prunes(tmp_path):
    a = _make_pdd_repo(tmp_path, "repoA")
    b = _make_pdd_repo(tmp_path, "repoB", marker="constitution.md")
    _make_pdd_repo(tmp_path, "node_modules")     # must be pruned
    found = set(find_pdd_repos([tmp_path]))
    assert a in found and b in found
    assert not any("node_modules" in str(p) for p in found)


def test_discover_disabled_without_cli(paths, tmp_path):
    prov = PddProvider({"enabled": True, "roots": [str(tmp_path)]})   # no cli
    assert prov.discover(paths) == []
    assert PddProvider({"enabled": False}).discover(paths) == []


def test_discover_emits_two_dashboards_per_repo(paths, tmp_path):
    cli = tmp_path / "pdd.ts"
    cli.write_text("// cli")
    repo = tmp_path / "myrepo"
    repo.mkdir()
    prov = PddProvider({"enabled": True, "cli": str(cli)},
                       repo_finder=lambda roots, depth: [repo])
    entries = prov.discover(paths)
    assert len(entries) == 2
    kinds = {e["id"].rsplit("-", 1)[-1] for e in entries}
    assert kinds == {"findings", "plan"}
    findings = next(e for e in entries if e["id"].endswith("findings"))
    assert findings["cmd"] == ["node", str(cli), "dashboard", str(repo),
                               "--port", str(findings["port"]), "--no-open"]
    assert 4300 <= findings["port"] <= 4399
    # ports are unique across the two dashboards and stable across re-discovery —
    # a FRESH provider (empty cache) must reproduce them from the persisted allocator.
    ports = {e["id"]: e["port"] for e in entries}
    assert len(set(ports.values())) == 2
    fresh = PddProvider({"enabled": True, "cli": str(cli)},
                        repo_finder=lambda roots, depth: [repo])
    again = {e["id"]: e["port"] for e in fresh.discover(paths)}
    assert again == ports


def test_discover_caches_fs_scan(paths, tmp_path):
    cli = tmp_path / "pdd.ts"
    cli.write_text("// cli")
    calls = []

    def finder(roots, depth):
        calls.append(1)
        return []

    prov = PddProvider({"enabled": True, "cli": str(cli)}, repo_finder=finder, ttl=60.0)
    prov.discover(paths)
    prov.discover(paths)
    assert len(calls) == 1        # second call served from cache, no re-scan


def test_discover_disambiguates_same_basename(paths, tmp_path):
    r1, r2 = tmp_path / "p1" / "cli", tmp_path / "p2" / "cli"
    r1.mkdir(parents=True)
    r2.mkdir(parents=True)
    prov = PddProvider({"enabled": True, "cli": str(tmp_path / "x")},
                       repo_finder=lambda roots, depth: [r1, r2])
    (tmp_path / "x").write_text("// cli")
    ids = [e["id"] for e in prov.discover(paths)]
    assert len(ids) == len(set(ids)) == 4        # no id collisions across the two 'cli' repos
