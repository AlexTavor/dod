import json
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import pytest

from dod.app import App
from dod.server import make_handler
from tests.conftest import entry, write_registry


@pytest.fixture
def server(paths):
    app = App(paths, providers=[], token="t")
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(app))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        yield base, app
    finally:
        httpd.shutdown()


def _req(base, method, path, payload=None, headers=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers or {})
    if data is not None and "Content-Type" not in (headers or {}):
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=4) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def _tok(payload=None):
    return {"X-Dod-Token": "t"}


def test_index_substitutes_token(server):
    base, _ = server
    req = urllib.request.Request(base + "/")
    body = urllib.request.urlopen(req, timeout=4).read().decode()
    assert "t" in body and "__TOKEN__" not in body


def test_state_lists_entries_and_discovered(server):
    base, _ = server
    code, body = _req(base, "GET", "/api/state")
    assert code == 200 and "entries" in body and "discovered" in body


def test_control_requires_token(server):
    base, _ = server
    code, body = _req(base, "POST", "/api/start", {"id": "x"})   # no token
    assert code == 403 and body["error"] == "bad token"


def test_bad_origin_rejected(server):
    base, _ = server
    code, body = _req(base, "POST", "/api/start", {"id": "x"},
                      headers={"X-Dod-Token": "t", "Origin": "http://evil.example"})
    assert code == 403 and body["error"] == "bad origin"


def test_start_unknown_id_404(server):
    base, _ = server
    code, body = _req(base, "POST", "/api/start", {"id": "ghost"}, headers=_tok())
    assert code == 404 and body["error"] == "unknown id"


def test_add_then_forget_roundtrip(server, paths):
    base, app = server
    code, body = _req(base, "POST", "/api/add",
                      {"name": "Adhoc", "port": 9100, "cmd": ["python3", "-m", "http.server"]},
                      headers=_tok())
    assert code == 200 and body["ok"] is True
    eid = body["id"]
    assert eid in app.registry.load()
    code, body = _req(base, "POST", "/api/forget", {"id": eid}, headers=_tok())
    assert code == 200 and body["ok"] is True
    assert eid not in app.registry.load()


def test_forget_durable_is_409(server, paths):
    write_registry(paths, [entry("dur")])
    base, _ = server
    code, body = _req(base, "POST", "/api/forget", {"id": "dur"}, headers=_tok())
    assert code == 409 and body["ok"] is False


def test_add_rejects_bad_port_boundary(server):
    base, _ = server
    # boundary: 65535 is valid, 65536 is not
    code, _ = _req(base, "POST", "/api/add", {"name": "ok", "port": 65535}, headers=_tok())
    assert code == 200
    code, body = _req(base, "POST", "/api/add", {"name": "bad", "port": 65536}, headers=_tok())
    assert code == 400 and body["error"] == "bad port"


def test_announce_is_token_exempt_but_contract_gated(server):
    base, app = server
    code, body = _req(base, "POST", "/api/announce",
                      {"contract": "dashkit/1", "port": 9200, "name": "Beacon"})
    assert code == 200 and body["ok"] is True
    assert any(c["port"] == 9200 for c in app.discovery.snapshot())
    code, body = _req(base, "POST", "/api/announce", {"port": 9201})   # no contract marker
    assert code == 400
