"""DERISK walking skeleton (PDD): the riskiest new seam in dod v2 — the action
round-trip (logic → display → logic) through dod's NEW POST /api/action proxy, with
its security. Exercised with REAL processes (a kit counter server + a real dod server),
no mocking of the risk path. See docs/derisk/wave0-kit.md.
"""
import json
import threading
import urllib.request
from http.server import ThreadingHTTPServer

from dod import kit
from dod.app import App
from dod.server import make_handler
from tests.conftest import entry, write_local


def _counter():
    """A real dod-kit/1 project: pure logic (a counter) with an action channel."""
    state = {"count": 0}

    def render():
        return {"title": "Counter", "panels": [{"type": "stat", "label": "count", "value": state["count"]}]}

    def on_action(action, payload):
        if action == "increment":
            state["count"] += 1
        elif action == "add":
            state["count"] += int(payload.get("n", 0))
        else:
            return {"ok": False, "error": "unknown action"}      # no-op: mutate nothing
        return {"ok": True, "count": state["count"]}

    httpd = ThreadingHTTPServer(("127.0.0.1", 0), kit.make_handler({"name": "Counter"}, render, on_action))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, state


def _post(base, payload, token):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Dod-Token"] = "t"
    req = urllib.request.Request(base + "/api/action", data=json.dumps(payload).encode(),
                                 method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=4) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def _render(base):
    return json.loads(urllib.request.urlopen(base + "/api/render?id=counter", timeout=4).read())


def test_action_roundtrip_through_dod(paths):
    counter, state = _counter()
    cport = counter.server_address[1]
    write_local(paths, [entry("counter", type="web-external", cmd=[], port=cport, stop="leave")])
    app = App(paths, providers=[], token="t")
    dod = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(app))
    threading.Thread(target=dod.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{dod.server_address[1]}"
    try:
        # render-up: dod proxies the project's spec
        assert _render(base)["panels"][0]["value"] == 0
        # interact-down WITH token: the action reaches the logic and mutates state
        code, b = _post(base, {"id": "counter", "action": "increment"}, token=True)
        assert code == 200 and b["count"] == 1
        # the loop closes: the next render reflects the mutation
        assert _render(base)["panels"][0]["value"] == 1
        # payload carries through
        code, b = _post(base, {"id": "counter", "action": "add", "payload": {"n": 5}}, token=True)
        assert b["count"] == 6
        # SECURITY (S2): a mutating action WITHOUT the token is refused, state untouched
        code, b = _post(base, {"id": "counter", "action": "increment"}, token=False)
        assert code == 403 and state["count"] == 6
        # NO-OP (adequacy): an unknown action mutates nothing
        code, b = _post(base, {"id": "counter", "action": "bogus"}, token=True)
        assert b["ok"] is False and state["count"] == 6
        # unknown project id is a clean 404, not a proxy crash
        code, b = _post(base, {"id": "ghost", "action": "increment"}, token=True)
        assert code == 404
    finally:
        dod.shutdown()
        counter.shutdown()
