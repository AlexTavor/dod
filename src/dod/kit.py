"""dod kit — the ``dod-kit/1`` contract (reference Python implementation).

A project's dashboard is PURE LOGIC: it derives state and emits a flat spec (dashkit
atoms); it never ships a frontend. dod renders the spec (web now) and routes user
actions back into the logic. Three endpoints, loopback only:

    GET  /api/meta    -> {contract:"dod-kit/1", kind:"spec", accepts_actions, refresh_ms, …}
    GET  /api/render  -> the spec                                   [render: up]
    POST /api/action  -> {action, payload} -> on_action -> result   [interact: down]

Security lives at dod's edge, not here: dod's POST /api/action is loopback + token
guarded, and dod→child is trusted loopback (same posture as dashkit today). So a kit
project does NOT carry its own token — it only ever binds 127.0.0.1 and trusts dod.

The kit owns the *transport*; the project owns the *meaning* of an action. on_action
returns a dict (typically the new state / an ack); an unknown action is the project's
call to no-op (return ``{"ok": False, ...}`` and mutate nothing).
"""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CONTRACT = "dod-kit/1"
HOST = "127.0.0.1"


def make_handler(meta: dict, render, on_action=None):
    full_meta = {"contract": CONTRACT, "kind": "spec", "version": "1",
                 "accepts_actions": on_action is not None,
                 "refresh_ms": meta.get("refresh_ms", 2000), **meta}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, obj):
            data = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            try:
                self.wfile.write(data)
            except BrokenPipeError:
                pass

        def do_GET(self):
            p = self.path.split("?", 1)[0]
            if p == "/api/meta":
                return self._send(200, full_meta)
            if p == "/api/render":
                try:
                    spec = render()
                except Exception as e:  # noqa: BLE001 — a sampler hiccup must not blank the view
                    spec = {"title": full_meta.get("name", "dashboard"),
                            "panels": [{"type": "log", "title": "render error", "text": repr(e)}]}
                return self._send(200, spec)
            if p == "/favicon.ico":
                return self._send(204, b"")
            return self._send(404, {"error": "not found"})

        def do_POST(self):
            if self.path.split("?", 1)[0] != "/api/action":
                return self._send(404, {"error": "not found"})
            if on_action is None:
                return self._send(405, {"error": "this dashboard accepts no actions"})
            n = int(self.headers.get("Content-Length") or 0)
            try:
                body = json.loads(self.rfile.read(n) or b"{}")
            except Exception:  # noqa: BLE001
                body = {}
            try:
                res = on_action(str(body.get("action", "")), body.get("payload") or {})
            except Exception as e:  # noqa: BLE001 — a bad action must not crash the dashboard
                return self._send(500, {"ok": False, "error": repr(e)})
            return self._send(200, res if isinstance(res, dict) else {"ok": True})

    return Handler


def serve(meta: dict, render, port: int, on_action=None, host: str = HOST) -> int:
    """Block, serving the contract. (For tests, use make_handler with your own server.)"""
    print(f"{meta.get('name', 'dashboard')} → http://{host}:{port}  (dod-kit/1"
          f"{', interactive' if on_action else ''})")
    ThreadingHTTPServer((host, port), make_handler(meta, render, on_action)).serve_forever()
    return 0
