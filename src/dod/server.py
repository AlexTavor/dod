"""HTTP layer — the list/live read endpoints and the token-guarded control endpoints.

GET   /                     the admin UI (web/index.html, __TOKEN__ substituted)
GET   /app.js /app.css      UI assets
GET   /dashkit.js           the shared spec renderer (for native-render dashboards)
GET   /api/state            {entries:[…liveness…], discovered:[…]}  ← list + live in one
GET   /api/discovered       discovered-but-unpinned candidates
GET   /api/render?id=       proxy a child's live spec (same-origin native render)
GET   /api/cmeta?id=        proxy a child's /api/meta
GET   /api/log?id=          tail a child's captured log
POST  /api/announce         token-EXEMPT passive beacon (contract-gated)
POST  /api/{start,stop,restart,archive,unarchive,add,forget,probe,pin,ignore}  guarded
"""
from __future__ import annotations

import hmac
import json
import re
import urllib.parse
from http.server import BaseHTTPRequestHandler

from .config import CONTRACT, ID_RE, WEB_DIR
from .probe import log_tail, proxy_get, proxy_post


def make_handler(app):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, body, ctype="application/json", no_cache=False):
            data = body.encode() if isinstance(body, str) else body
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            if no_cache:
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            try:
                self.wfile.write(data)
            except BrokenPipeError:
                pass

        def _static(self, name, ctype):
            try:
                body = (WEB_DIR / name).read_text(encoding="utf-8")
            except FileNotFoundError:
                return self._send(404, f"// {name} not found", "text/plain")
            if name == "index.html":
                body = body.replace("__TOKEN__", app.token)
            return self._send(200, body, ctype, no_cache=True)

        def _guard(self) -> bool:
            origin = self.headers.get("Origin")
            allowed = {f"http://127.0.0.1:{self.server.server_port}",
                       f"http://localhost:{self.server.server_port}"}
            if origin and origin not in allowed:
                self._send(403, json.dumps({"error": "bad origin"}))
                return False
            if not hmac.compare_digest(self.headers.get("X-Dod-Token") or "", app.token):
                self._send(403, json.dumps({"error": "bad token"}))
                return False
            return True

        def _body(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            try:
                return json.loads(self.rfile.read(n) or b"{}")
            except Exception:  # noqa: BLE001
                return {}

        def _qs_id(self) -> str:
            return urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("id", [""])[0]

        def do_GET(self):
            p = self.path.split("?", 1)[0]
            if p == "/":
                return self._static("index.html", "text/html; charset=utf-8")
            if p == "/app.js":
                return self._static("app.js", "application/javascript; charset=utf-8")
            if p == "/app.css":
                return self._static("app.css", "text/css; charset=utf-8")
            if p == "/dashkit.js":
                return self._static("dashkit.js", "application/javascript; charset=utf-8")
            if self.path.startswith("/api/state"):
                return self._send(200, json.dumps(
                    {"entries": app.snapshot(), "discovered": app.discovery.snapshot()}))
            if self.path.startswith("/api/discovered"):
                return self._send(200, json.dumps({"entries": app.discovery.snapshot()}))
            if self.path.startswith("/api/render") or self.path.startswith("/api/cmeta"):
                eid = self._qs_id()
                if not ID_RE.match(eid):
                    return self._send(400, json.dumps({"error": "bad id"}))
                port = (app.registry.get(eid) or {}).get("port")
                if not port:
                    return self._send(404, json.dumps({"error": "unknown id or no port"}))
                sub = "/api/render" if self.path.startswith("/api/render") else "/api/meta"
                code, data = proxy_get(int(port), sub)
                return self._send(code, data)
            if self.path.startswith("/api/log"):
                eid = self._qs_id()
                if not ID_RE.match(eid):
                    return self._send(400, json.dumps({"error": "bad id"}))
                return self._send(200, json.dumps({"log": log_tail(app.paths.log(eid))}))
            return self._send(404, json.dumps({"error": "not found"}))

        def do_POST(self):
            action = self.path.rsplit("/", 1)[-1]
            if action == "announce":
                return self._announce()
            if not self._guard():
                return
            body = self._body()
            eid = body.get("id", "")
            if action == "action":          # interact-down: route a UI action to the project logic
                if not ID_RE.match(eid):
                    return self._send(400, json.dumps({"error": "bad id"}))
                port = (app.registry.get(eid) or {}).get("port")
                if not port:
                    return self._send(404, json.dumps({"error": "unknown id or no port"}))
                payload = json.dumps({"action": body.get("action"),
                                      "payload": body.get("payload") or {}}).encode()
                code, data = proxy_post(int(port), "/api/action", payload)
                return self._send(code, data)
            if action == "add":
                return self._add(body)
            if action == "forget":
                res = app.registry.forget(eid)
                return self._send(200 if res.get("ok") else 409, json.dumps(res))
            if action == "probe":
                return self._send(200, json.dumps(app.discovery.probe_now(body.get("range"))))
            if action == "pin":
                res = app.discovery.pin(eid)
                return self._send(200 if res.get("ok") else 409, json.dumps(res))
            if action == "ignore":
                res = app.discovery.ignore(eid)
                return self._send(200 if res.get("ok") else 409, json.dumps(res))
            e = app.registry.get(eid)
            if not e:
                return self._send(404, json.dumps({"error": "unknown id"}))
            if action == "start":
                res = app.supervisor.start(e)
            elif action == "stop":
                res = app.supervisor.stop(e)
            elif action == "restart":
                res = app.supervisor.restart(e)
            elif action == "archive":
                app.registry.write_overlay(eid, "archived")
                if eid in app.supervisor.procs or app.supervisor._read_lock(eid):
                    app.supervisor.stop(e)
                res = {"ok": True}
            elif action == "unarchive":
                app.registry.write_overlay(eid, None)
                res = {"ok": True}
            else:
                res = {"ok": False, "error": f"unknown action {action}"}
            return self._send(200 if res.get("ok") else 409, json.dumps(res))

        def _add(self, body):
            try:
                port = int(body.get("port"))
                assert 1 <= port <= 65535
            except Exception:  # noqa: BLE001
                return self._send(400, json.dumps({"error": "bad port"}))
            cmd = body.get("cmd") or []
            if not isinstance(cmd, list) or not all(isinstance(a, str) for a in cmd):
                return self._send(400, json.dumps({"error": "cmd must be an argv list of strings"}))
            name = str(body.get("name", ""))[:120]
            eid = re.sub(r"[^a-z0-9_-]", "-", name.lower())[:40] or "adhoc"
            launchable = bool(cmd)
            entry = {"id": eid, "name": name or eid, "blurb": str(body.get("blurb", ""))[:200],
                     "why": str(body.get("why", "Ad-hoc, added at runtime."))[:500],
                     "tags": [str(t)[:24] for t in (body.get("tags") or ["transient"])][:6],
                     "type": "web" if launchable else "web-external",
                     "cmd": cmd, "cwd": str(body.get("cwd") or ".")[:400], "port": port,
                     "ready": {"kind": "http", "path": "/", "status": 200},
                     "stop": "sigterm" if launchable else "leave",
                     "singleton": True, "source": "local"}
            app.registry.add_local(entry)
            return self._send(200, json.dumps({"ok": True, "id": eid}))

        def _announce(self):
            body = self._body()
            try:
                port = int(body.get("port"))
                assert 1 <= port <= 65535
            except Exception:  # noqa: BLE001
                return self._send(400, json.dumps({"error": "bad port"}))
            if body.get("contract") != CONTRACT:
                return self._send(400, json.dumps({"error": "not a dashkit announce"}))
            app.discovery.record(body, port)
            return self._send(200, json.dumps({"ok": True}))

    return Handler
