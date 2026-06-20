from dod.registry import Registry, validate
from tests.conftest import entry, write_local, write_registry


def test_validate_defaults_applied():
    v = validate({"id": "a", "type": "web", "cmd": ["x"]}, "registry")
    assert v["stop"] == "sigterm" and v["singleton"] is True
    assert v["ready"] == {"kind": "port"} and v["ready_timeout_s"] == 20
    assert v["source"] == "registry"


def test_validate_rejects_bad_type_and_cmd_and_id():
    assert validate({"id": "a", "type": "nope", "cmd": []}, "s") is None
    assert validate({"id": "a", "type": "web", "cmd": "shell string"}, "s") is None
    assert validate({"id": "BAD ID", "type": "web", "cmd": []}, "s") is None


def test_validate_coerces_port_and_rejects_garbage():
    assert validate({"id": "a", "type": "web", "cmd": [], "port": "8077"}, "s")["port"] == 8077
    assert validate({"id": "a", "type": "web", "cmd": [], "port": "nope"}, "s") is None


def test_local_overrides_durable_on_id_collision(paths):
    write_registry(paths, [entry("dup", name="from-durable", port=1)])
    write_local(paths, [entry("dup", name="from-local", port=2, source="local")])
    loaded = Registry(paths, providers=[]).load()
    assert loaded["dup"]["name"] == "from-local"


def test_provider_entries_merged_but_durable_wins(paths):
    class P:
        name = "p"
        def discover(self, _paths):
            return [entry("a", name="prov"), entry("b", name="prov-only")]

    write_registry(paths, [entry("a", name="durable")])
    loaded = Registry(paths, providers=[P()]).load()
    assert loaded["a"]["name"] == "durable"          # durable beats provider
    assert loaded["b"]["name"] == "prov-only"        # provider-only survives
    assert loaded["b"]["provider"] == "p"


def test_broken_provider_does_not_sink_registry(paths):
    class Boom:
        name = "boom"
        def discover(self, _paths):
            raise RuntimeError("kaboom")

    write_registry(paths, [entry("a")])
    loaded = Registry(paths, providers=[Boom()]).load()
    assert "a" in loaded                             # registry still loads


def test_archive_overlay_sets_state_override(paths, registry):
    write_registry(paths, [entry("a")])
    registry.write_overlay("a", "archived")
    assert registry.load()["a"]["state_override"] == "archived"
    registry.write_overlay("a", None)
    assert "state_override" not in registry.load()["a"]


def test_forget_removes_local_entry(paths, registry):
    write_local(paths, [entry("x", source="local")])
    assert registry.forget("x")["ok"] is True
    assert "x" not in registry.load()


def test_forget_refuses_durable_and_unknown(paths, registry):
    write_registry(paths, [entry("dur")])
    assert registry.forget("dur")["ok"] is False     # durable is read-only — archive instead
    assert registry.forget("ghost")["ok"] is False


def test_forget_durable_is_a_noop_on_local_file(paths, registry):
    # no-op path: forgetting a non-local id must not mutate local.json
    write_registry(paths, [entry("dur")])
    write_local(paths, [entry("keep", source="local")])
    before = paths.local.read_text()
    registry.forget("dur")
    assert paths.local.read_text() == before


def test_resolve_cwd_absolute_vs_relative(paths, tmp_path):
    reg = Registry(paths, providers=[], project_base=tmp_path)
    assert reg.resolve_cwd(entry(cwd="/abs/here")) == "/abs/here"
    assert reg.resolve_cwd(entry(cwd="sub")) == str(tmp_path / "sub")


def test_duplicate_port_lint_warns(paths, capsys):
    write_registry(paths, [entry("a", port=9000), entry("b", port=9000)])
    Registry(paths, providers=[]).load()
    assert "duplicate port 9000" in capsys.readouterr().out
