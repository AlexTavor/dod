"""Network probes — the third liveness signal (never ``ps``-by-name).

A short HTTP GET that also sniffs frame-blocking headers (so a dashboard that can't
be iframed auto-demotes to "open in new tab"), a contract sniff (``/api/meta``), and
a same-origin proxy (so dod can render a child's spec without every child needing CORS).
"""
from __future__ import annotations

import json
import os
import socket
import urllib.error
import urllib.request
from pathlib import Path

from .config import CONTRACT, HOST


def port_open(port: int) -> bool:
    s = socket.socket()
    s.settimeout(0.2)
    try:
        return s.connect_ex((HOST, int(port))) == 0
    except Exception:  # noqa: BLE001
        return False
    finally:
        s.close()


def probe(port: int, ready: dict) -> tuple[bool, bool, int | None]:
    """(ok, embeddable, status). embeddable=False if it sends frame-blocking headers."""
    path = ready.get("path", "/") if ready.get("kind") == "http" else "/"
    try:
        req = urllib.request.Request(f"http://{HOST}:{int(port)}{path}", method="GET")
        with urllib.request.urlopen(req, timeout=0.4) as r:
            status = r.status
            xfo = r.headers.get("X-Frame-Options")
            csp = (r.headers.get("Content-Security-Policy") or "").lower()
            embeddable = not xfo and "frame-ancestors" not in csp
            want = ready.get("status", 200) if ready.get("kind") == "http" else None
            ok = (status == want) if want else (200 <= status < 500)
            return ok, embeddable, status
    except Exception:  # noqa: BLE001
        return False, True, None


def fetch_meta(port: int) -> dict | None:
    """GET /api/meta, returned ONLY for a dashkit contract response — the marker is the
    discriminator that lets a foreign dashboard keep its own /api/meta without dod
    mistaking it for native-spec."""
    try:
        req = urllib.request.Request(f"http://{HOST}:{int(port)}/api/meta", method="GET")
        with urllib.request.urlopen(req, timeout=0.4) as r:
            m = json.loads(r.read(200_000) or b"{}")
        return m if isinstance(m, dict) and m.get("contract") == CONTRACT else None
    except Exception:  # noqa: BLE001
        return None


def proxy_get(port: int, path: str) -> tuple[int, bytes]:
    """Server-side GET of a child's read-only endpoint, so dod can render a child's
    spec same-origin (dod owns the id→port map; no CORS on every dashboard)."""
    try:
        req = urllib.request.Request(f"http://{HOST}:{int(port)}{path}", method="GET")
        with urllib.request.urlopen(req, timeout=1.2) as r:
            return r.status, r.read(2_000_000)
    except urllib.error.HTTPError as e:
        return e.code, (e.read(100_000) or b"{}")
    except Exception as e:  # noqa: BLE001
        return 502, json.dumps({"error": f"upstream {port}: {e}"}).encode()


def log_tail(path: Path, n: int = 1400) -> str:
    try:
        with open(path, "rb") as f:
            try:
                f.seek(-n, os.SEEK_END)
            except OSError:
                f.seek(0)
            return f.read().decode("utf-8", "replace")
    except FileNotFoundError:
        return ""
