import logging

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
        def discover(self, _paths, _reserved=frozenset()):
            return [entry("a", name="prov"), entry("b", name="prov-only")]

    write_registry(paths, [entry("a", name="durable")])
    loaded = Registry(paths, providers=[P()]).load()
    assert loaded["a"]["name"] == "durable"          # durable beats provider
    assert loaded["b"]["name"] == "prov-only"        # provider-only survives
    assert loaded["b"]["provider"] == "p"


def test_broken_provider_does_not_sink_registry(paths):
    class Boom:
        name = "boom"
        def discover(self, _paths, _reserved=frozenset()):
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


def test_duplicate_port_lint_warns(paths, caplog):
    write_registry(paths, [entry("a", port=9000), entry("b", port=9000)])
    with caplog.at_level(logging.WARNING, logger="dod"):
        Registry(paths, providers=[]).load()
    assert "duplicate port 9000" in caplog.text


def test_reserved_ports_are_threaded_through_providers_in_order(paths):
    """Regression: an allocating provider was handed a port a PEER provider already bound.

    The first fix aimed at the wrong layer. It reserved ports from the durable and local
    files, but the colliding ports came from the *manifest provider* — entries that declare
    their own port and never touch the allocator. Only the Registry sees every source, and
    the collision cannot be repaired afterwards because a provider bakes its port into the
    argv it emits, so the reservation set is threaded down in provider order.
    """
    seen: list[frozenset[int]] = []

    class Declaring:                       # stands in for ManifestProvider: author-set ports
        name = "declaring"
        def discover(self, _paths, reserved=frozenset()):
            seen.append(reserved)
            return [entry("jobsearch", port=4317)]

    class Allocating:                      # stands in for PddProvider: dod-assigned ports
        name = "allocating"
        def discover(self, _paths, reserved=frozenset()):
            seen.append(reserved)
            port = next(p for p in range(4300, 4400) if p not in reserved)
            return [entry("pdd-hoops-plan", port=port)]

    loaded = Registry(paths, providers=[Declaring(), Allocating()]).load()

    assert seen[0] == frozenset()                       # nothing claimed yet
    assert 4317 in seen[1]                              # the peer's port reached the allocator
    assert loaded["pdd-hoops-plan"]["port"] != 4317
    ports = sorted(e["port"] for e in loaded.values() if e.get("port"))
    assert len(ports) == len(set(ports))                # no duplicate port in the merged catalog


def test_terminal_provider_entries_do_not_reserve_a_port(paths):
    """no-op path: a terminal entry binds nothing, so it must not shrink the pool.

    Matches _lint_ports, which skips terminals for the same reason.
    """
    seen: list[frozenset[int]] = []

    class Term:
        name = "term"
        def discover(self, _paths, reserved=frozenset()):
            return [entry("shell", type="terminal", port=4317)]

    class Watcher:
        name = "watcher"
        def discover(self, _paths, reserved=frozenset()):
            seen.append(reserved)
            return []

    Registry(paths, providers=[Term(), Watcher()]).load()
    assert seen[0] == frozenset()
