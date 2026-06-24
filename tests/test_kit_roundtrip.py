"""DERISK walking skeleton (PDD): the riskiest new seam in dod v2 — the kit's
render-up + action-down round-trip, proven through the REAL engine path (the contract
discriminator + supervisor.state), not a raw id+port bypass. Exercised with real
processes. See docs/derisk/wave0-kit.md.

Covers the negative space the derisk scrutiny demanded: the discriminator resolving a
kit to render:'spec'; a no-action (read-only) dashboard's 405; a throwing handler's 500;
wrong-token and cross-origin guard branches; and a registered-but-dead 502.
"""
import json
import threading
import urllib.request
from http.server import ThreadingHTTPServer

from dod import kit
from dod.app import App
from dod.server import make_handler
from tests.conftest import entry


def _kit(render, on_action=None, meta=None):
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), kit.make_handler(meta or {"name": "K"}, render, on_action))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def _counter():
    state = {"count": 0}

    def render():
        return {"title": "Counter", "panels": [{"type": "stat", "label": "count", "value": state["count"]}]}

    def on_action(action, payload):
        if action == "increment":
            state["count"] += 1
        elif action == "add":
            state["count"] += int(payload.get("n", 0))
        elif action == "boom":
            raise RuntimeError("boom")          # exercises the kit's 500 trap
        else:
            return {"ok": False, "error": "unknown action"}   # no-op
        return {"ok": True, "count": state["count"]}

    httpd, port = _kit(render, on_action, {"name": "Counter"})
    return httpd, port, state


def _dod(paths, token="t"):
    app = App(paths, providers=[], token=token)
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(app))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return app, httpd, f"http://127.0.0.1:{httpd.server_address[1]}"


def _post(base, payload, token=True, token_value="t", origin=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Dod-Token"] = token_value
    if origin:
        headers["Origin"] = origin
    req = urllib.request.Request(base + "/api/action", data=json.dumps(payload).encode(),
                                 method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            return e.code, json.loads(body or b"{}")
        except Exception:  # noqa: BLE001
            return e.code, {}


def _render(base):
    return json.loads(urllib.request.urlopen(base + "/api/render?id=counter", timeout=4).read())


# ── the seam: discriminator + action round-trip, through the real path ────
def test_discriminator_resolves_kit_to_spec(paths):
    """B1+B2: the REAL fetch_meta + supervisor.state path resolves a kit to render:'spec'
    (the skeleton no longer bypasses the discriminator)."""
    counter, port, _ = _counter()
    app, dod, _ = _dod(paths)
    app.registry.add_local(entry("counter", type="web-external", cmd=[], port=port, stop="leave"))
    try:
        st = app.supervisor.state(app.registry.get("counter"))
        assert st["render"] == "spec"               # resolved via real /api/meta, not assumed
        assert st["state"] in ("ready", "external")
    finally:
        dod.shutdown()
        counter.shutdown()


def test_action_roundtrip_through_dod(paths):
    counter, port, state = _counter()
    app, dod, base = _dod(paths)
    app.registry.add_local(entry("counter", type="web-external", cmd=[], port=port, stop="leave"))
    try:
        assert _render(base)["panels"][0]["value"] == 0
        code, b = _post(base, {"id": "counter", "action": "increment"})
        assert code == 200 and b["count"] == 1
        assert _render(base)["panels"][0]["value"] == 1     # loop closes
        code, b = _post(base, {"id": "counter", "action": "add", "payload": {"n": 5}})
        assert b["count"] == 6
        # no-op: unknown action mutates nothing
        code, b = _post(base, {"id": "counter", "action": "bogus"})
        assert b["ok"] is False and state["count"] == 6
        # unknown project id → clean 404, not a proxy crash
        assert _post(base, {"id": "ghost", "action": "increment"})[0] == 404
    finally:
        dod.shutdown()
        counter.shutdown()


# ── security: full guard surface (R2 earned, not asserted by prose) ───────
def test_action_guard_rejects_no_wrong_token_and_foreign_origin(paths):
    counter, port, state = _counter()
    app, dod, base = _dod(paths)
    app.registry.add_local(entry("counter", type="web-external", cmd=[], port=port, stop="leave"))
    try:
        assert _post(base, {"id": "counter", "action": "increment"}, token=False)[0] == 403
        assert _post(base, {"id": "counter", "action": "increment"}, token_value="wrong")[0] == 403
        assert _post(base, {"id": "counter", "action": "increment"}, origin="http://evil.example")[0] == 403
        assert state["count"] == 0                  # nothing mutated through any rejected path
    finally:
        dod.shutdown()
        counter.shutdown()


# ── robustness / contract negative space ─────────────────────────────────
def test_no_action_dashboard_returns_405(paths):
    ro, port = _kit(lambda: {"title": "RO", "panels": []})        # on_action=None → read-only
    app, dod, base = _dod(paths)
    app.registry.add_local(entry("ro", type="web-external", cmd=[], port=port, stop="leave"))
    try:
        meta = json.loads(urllib.request.urlopen(base + "/api/cmeta?id=ro", timeout=4).read())
        assert meta["accepts_actions"] is False
        assert _post(base, {"id": "ro", "action": "x"})[0] == 405
    finally:
        dod.shutdown()
        ro.shutdown()


def test_throwing_action_is_500_and_child_survives(paths):
    counter, port, _ = _counter()
    app, dod, base = _dod(paths)
    app.registry.add_local(entry("counter", type="web-external", cmd=[], port=port, stop="leave"))
    try:
        assert _post(base, {"id": "counter", "action": "boom"})[0] == 500
        assert _render(base)["panels"][0]["value"] == 0     # child still serving after the throw
    finally:
        dod.shutdown()
        counter.shutdown()


def test_registered_but_dead_project_is_502(paths):
    dead, port = _kit(lambda: {"panels": []})
    dead.shutdown()                                  # port now closed but entry still registered
    app, dod, base = _dod(paths)
    app.registry.add_local(entry("dead", type="web-external", cmd=[], port=port, stop="leave"))
    try:
        assert _post(base, {"id": "dead", "action": "x"})[0] == 502
    finally:
        dod.shutdown()


# ── standalone shim is real HTML (regression: _send json.dumps'd a str body) ──
def test_standalone_shim_is_raw_html():
    """GET / on a kit serves the shim as real HTML, not a JSON-escaped string, so opening
    a kit's port directly renders the dashboard instead of showing escaped source."""
    httpd, port = _kit(lambda: {"panels": []}, meta={"name": "K"})
    try:
        body = urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=4).read().decode()
    finally:
        httpd.shutdown()
    assert body.startswith("<!doctype html>")      # not '"<!doctype...' (would mean JSON-encoded)
    assert "<title>K</title>" in body              # the meta name is substituted into the shim
    assert "dashkit.mount" in body
