"""`dod <subcommand>` — drives a RUNNING dod over HTTP, authenticating with the per-boot
token dod wrote to $DOD_HOME/token. This is the agent-control surface: route every
dashboard op THROUGH dod instead of hand-launching (the orphan/port cure itself).
"""
from __future__ import annotations

import argparse
import json
import os
import shlex
import urllib.error
import urllib.request
from typing import Any

from .config import DEFAULT_PORT, HOST, Paths
from .util import load_json

CLI_COMMANDS = ("ls", "ps", "add", "open", "start", "stop", "restart", "forget",
                "archive", "unarchive", "probe", "pin", "ignore", "discovered")


def _client_url(paths: Paths) -> str:
    if os.environ.get("DOD_URL"):
        return os.environ["DOD_URL"].rstrip("/")
    info = load_json(paths.server)
    if info.get("url"):
        return str(info["url"]).rstrip("/")
    return f"http://{HOST}:{DEFAULT_PORT}"


def _client_token(paths: Paths) -> str:
    try:
        return paths.token.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ""


def _api(paths: Paths, method: str, path: str,
         payload: dict[str, Any] | None = None) -> tuple[int, dict[str, Any]]:
    url = _client_url(paths) + path
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
        req.add_header("X-Dod-Token", _client_token(paths))
    try:
        # 15s, not 8s: under a cold-start storm (several `uv`/duckdb children booting at
        # once) the daemon's thread can be CPU-starved briefly; don't read that as down.
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:  # noqa: BLE001
            return e.code, {"error": e.reason}
    except Exception as e:  # noqa: BLE001
        return 0, {"error": f"cannot reach dod at {_client_url(paths)} ({e}); is it running? `dod` "
                            f"or `dod daemon install`"}


def _state_rows(paths: Paths) -> list[dict[str, Any]]:
    code, body = _api(paths, "GET", "/api/state")
    return body.get("entries", []) if code == 200 else []


def _print_rows(rows: list[dict[str, Any]]) -> None:
    if not rows:
        print("(no dashboards — is dod running?)")
        return
    w = max((len(r["id"]) for r in rows), default=2)
    for r in sorted(rows, key=lambda r: r["id"]):
        port = f":{r['port']}" if r.get("port") else "—"
        print(f"  {r['id']:<{w}}  {r.get('state', ''):<16} {port:<7} {r.get('name', '')}")


def _add_payload(name: str, port: int, cmd: str | None, cwd: str,
                 blurb: str = "", why: str = "") -> dict[str, Any]:
    p = {"name": name, "port": port, "cwd": cwd, "blurb": blurb, "why": why}
    if cmd:
        p["cmd"] = shlex.split(cmd)
    return p


def run(argv: list[str], paths: Paths | None = None) -> int:
    paths = paths or Paths.create()
    cmd, rest = argv[0], argv[1:]
    if cmd in ("ls", "ps"):
        _print_rows(_state_rows(paths))
        return 0
    if cmd == "discovered":
        code, body = _api(paths, "GET", "/api/discovered")
        rows = body.get("entries", []) if code == 200 else []
        print("(nothing discovered)" if not rows else "")
        for r in rows:
            print(f"  :{r.get('port')}  {r.get('name', '?')}  — {r.get('blurb', '')}")
        return 0
    if cmd == "add":
        ap = argparse.ArgumentParser(prog="dod add")
        ap.add_argument("name")
        ap.add_argument("--port", type=int, required=True)
        ap.add_argument("--cmd", help="argv to launch it, quoted as one string; omit to adopt a running port")
        ap.add_argument("--cwd", default=".")
        ap.add_argument("--blurb", default="")
        ap.add_argument("--why", default="")
        a = ap.parse_args(rest)
        code, body = _api(paths, "POST", "/api/add",
                          _add_payload(a.name, a.port, a.cmd, a.cwd, a.blurb, a.why))
        print(json.dumps(body))
        return 0 if code == 200 and body.get("ok") else 1
    if cmd == "open":
        ap = argparse.ArgumentParser(prog="dod open")
        ap.add_argument("id")
        ap.add_argument("--port", type=int)
        ap.add_argument("--cmd")
        ap.add_argument("--cwd", default=".")
        a = ap.parse_args(rest)
        eid = a.id
        if not any(r["id"] == eid for r in _state_rows(paths)):
            if not a.port:
                print(f"unknown dashboard {eid!r}; pass --port (and optionally --cmd) to register it first")
                return 1
            code, body = _api(paths, "POST", "/api/add", _add_payload(eid, a.port, a.cmd, a.cwd))
            if code != 200 or not body.get("ok"):
                print(json.dumps(body))
                return 1
            eid = body.get("id", eid)
        code, body = _api(paths, "POST", "/api/start", {"id": eid})
        if code == 200 and body.get("ok"):
            print(f"opened {eid} → {_client_url(paths)}  (select it in the dod UI)")
            return 0
        print(json.dumps(body))
        return 1
    if cmd in ("start", "stop", "restart", "forget", "archive", "unarchive", "pin", "ignore"):
        if not rest:
            print(f"usage: dod {cmd} <id>")
            return 1
        code, body = _api(paths, "POST", f"/api/{cmd}", {"id": rest[0]})
        print(json.dumps(body))
        return 0 if code == 200 and body.get("ok") else 1
    if cmd == "probe":
        ap = argparse.ArgumentParser(prog="dod probe")
        ap.add_argument("--range", help="port band to sweep, e.g. 8070-8099 (default: registry ports only)")
        a = ap.parse_args(rest)
        code, body = _api(paths, "POST", "/api/probe", {"range": a.range} if a.range else {})
        print(json.dumps(body))
        return 0 if code == 200 else 1
    print(f"dod: unknown command {cmd!r}; try one of: {' '.join(CLI_COMMANDS)}")
    return 2
