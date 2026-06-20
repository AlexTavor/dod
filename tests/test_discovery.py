import dod.probe as probe
from dod.discovery import Discovery
from tests.conftest import Clock, entry, write_registry


def _disc(paths, registry):
    return Discovery(paths, registry, clock=Clock())


def test_record_then_pin_promotes_to_local(paths, registry):
    d = _disc(paths, registry)
    d.record({"name": "Foo", "blurb": "b", "render": "iframe"}, 9001)
    assert any(c["port"] == 9001 for c in d.snapshot())
    res = d.pin("disc-9001")
    assert res["ok"] is True
    assert res["id"] in registry.load()          # now a real local entry
    assert d.snapshot() == []                     # candidate consumed


def test_record_skips_registered_port(paths, registry):
    write_registry(paths, [entry("a", port=9002)])
    d = _disc(paths, registry)
    d.record({"name": "Dup"}, 9002)
    assert d.snapshot() == []                      # already a known dashboard, not "discovered"


def test_ignore_prevents_reappearance(paths, registry):
    d = _disc(paths, registry)
    d.record({"name": "Foo"}, 9003)
    d.ignore("disc-9003")
    d.record({"name": "Foo again"}, 9003)         # ignored port stays hidden
    assert d.snapshot() == []


def test_prune_dead_removes_only_dead(paths, registry, monkeypatch):
    d = _disc(paths, registry)
    d.record({"name": "Foo"}, 9004)
    monkeypatch.setattr(probe, "port_open", lambda p: True)
    d.prune_dead()
    assert len(d.snapshot()) == 1                  # no-op: still alive
    monkeypatch.setattr(probe, "port_open", lambda p: False)
    d.prune_dead()
    assert d.snapshot() == []                      # gone once the port disappears
