from dod.app import App


def test_token_persists_across_restarts(paths):
    # an existing on-disk token is reused (so an open browser tab survives a daemon reload)
    paths.token.write_text("fixedtok0123456789")
    assert App(paths, providers=[]).token == "fixedtok0123456789"


def test_token_generated_when_absent(paths):
    t = App(paths, providers=[]).token
    assert t and len(t) >= 16


def test_shutdown_keeps_token_drops_server_info(paths):
    app = App(paths, providers=[], token="t")
    app._serving = True
    app.write_runtime_files(8090)
    assert paths.token.exists() and paths.server.exists()
    app.shutdown()
    assert paths.token.exists()          # token persists across restarts
    assert not paths.server.exists()     # connection info is dropped


def test_set_order_sorts_snapshot(paths):
    app = App(paths, providers=[], token="t")
    app.states = {"a": {"id": "a"}, "b": {"id": "b"}, "c": {"id": "c"}}
    app.set_order(["c", "a"])
    assert [r["id"] for r in app.snapshot()] == ["c", "a", "b"]   # ranked first, then unranked by id


def test_snapshot_default_order_is_by_id(paths):
    app = App(paths, providers=[], token="t")
    app.states = {"b": {"id": "b"}, "a": {"id": "a"}}
    assert [r["id"] for r in app.snapshot()] == ["a", "b"]
