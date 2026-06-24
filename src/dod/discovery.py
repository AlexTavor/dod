"""Contract-gated discovery — dod only adopts ports that ANSWER /api/meta as dashkit,
never a blind port scan. Two intakes: announce (push, a dashkit dashboard POSTs its
meta on startup) and contract-probe (pull). Discovered ≠ active: a candidate must be
pinned before dod renders/manages it.
"""
from __future__ import annotations

import re
import threading
import time
from collections.abc import Callable
from typing import cast

from . import probe as net
from .config import Paths
from .models import ActionResult, Discovered, Entry, Meta
from .registry import Registry
from .util import load_json, write_json


def disc_id(port: int) -> str:
    return f"disc-{int(port)}"


class Discovery:
    def __init__(self, paths: Paths, registry: Registry, clock: Callable[[], float] = time.time) -> None:
        self.paths = paths
        self.registry = registry
        self.clock = clock
        self.lock = threading.Lock()
        self.found: dict[str, Discovered] = {}  # synthetic-id → contract-speaker not yet pinned
        self.ignored: set[int] = set()        # ports the user said "don't show me this"

    def load(self) -> None:
        data = load_json(self.paths.discovered)
        with self.lock:
            self.found.clear()
            for e in data.get("entries", []):
                if e.get("id"):
                    self.found[e["id"]] = e
            self.ignored.clear()
            self.ignored.update(int(p) for p in data.get("ignored", []) if str(p).isdigit())

    def _save(self) -> None:
        write_json(self.paths.discovered,
                   {"entries": list(self.found.values()), "ignored": sorted(self.ignored)})

    def record(self, meta: Meta, port: int) -> None:
        """Note a contract-speaker — unless its port is already registered or ignored."""
        port = int(port)
        if port in self.ignored:
            return
        if any(e.get("port") == port for e in self.registry.load().values()):
            return
        did = disc_id(port)
        with self.lock:
            self.found[did] = cast(Discovered, {
                "id": did, "port": port, "render": meta.get("render", "iframe"),
                "name": str(meta.get("name", f"port {port}"))[:120],
                "blurb": str(meta.get("blurb", ""))[:200],
                "why": str(meta.get("why", ""))[:500],
                "announced_at": self.clock(),
            })
            self._save()

    def pin(self, did: str) -> ActionResult:
        """Promote a discovered candidate to a real (adopt-only) local entry."""
        with self.lock:
            d = self.found.get(did)
        if not d:
            return {"ok": False, "error": "unknown discovered id"}
        eid = re.sub(r"[^a-z0-9_-]", "-", str(d["name"]).lower()).strip("-")[:40] or f"port-{d['port']}"
        self.registry.add_local(cast(Entry, {
            "id": eid, "name": d["name"], "blurb": d.get("blurb", ""),
            "why": d.get("why") or "Discovered contract-speaker, pinned at runtime.",
            "tags": ["discovered"], "type": "web-external", "cmd": [], "cwd": ".",
            "port": d["port"], "ready": {"kind": "http", "path": "/api/meta", "status": 200},
            "stop": "leave", "singleton": True, "source": "local"}))
        with self.lock:
            self.found.pop(did, None)
            self._save()
        return {"ok": True, "id": eid}

    def ignore(self, did: str) -> ActionResult:
        with self.lock:
            d = self.found.pop(did, None)
            if d:
                self.ignored.add(int(d["port"]))
            self._save()
        return cast(ActionResult, {"ok": bool(d), **({} if d else {"error": "unknown discovered id"})})

    def probe_now(self, rng: str | None) -> dict[str, object]:
        """Contract-probe: registry ports by default (tight); opt-in band via `range`
        (bounded ≤200 ports). Adopts only ports answering the dashkit contract."""
        ports = {int(p) for e in self.registry.load().values() if (p := e.get("port"))}
        if rng:
            m = re.match(r"^\s*(\d+)\s*-\s*(\d+)\s*$", str(rng))
            if m:
                a, b = int(m.group(1)), int(m.group(2))
                if 1 <= a <= b <= 65535 and (b - a) <= 200:
                    ports.update(range(a, b + 1))
        found = []
        for p in sorted(ports):
            if not net.port_open(p):
                continue
            meta = net.fetch_meta(p)
            if meta:
                self.record(meta, p)
                found.append({"port": p, "name": meta.get("name")})
        return {"ok": True, "found": found, "probed": len(ports)}

    def prune_dead(self) -> None:
        """Drop discovered candidates whose port went away (called by the sampler)."""
        with self.lock:
            items = list(self.found.items())
        dead = [did for did, d in items if not net.port_open(int(d["port"]))]
        if dead:
            with self.lock:
                for did in dead:
                    self.found.pop(did, None)
                self._save()

    def snapshot(self) -> list[Discovered]:
        with self.lock:
            return list(self.found.values())
