"""Stable port assignment.

Providers (e.g. PDD) emit one dashboard *per target repo* from the same binary,
whose own default port is hardcoded — so two targets collide. dod owns port
assignment instead: each logical key gets a port from a pool, persisted to
``ports.json`` so the same dashboard keeps the same port across restarts.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .util import load_json, write_json

POOL_START = 4300
POOL_END = 4399


@dataclass
class PortAllocator:
    path: Path
    start: int = POOL_START
    end: int = POOL_END

    def _load(self) -> dict[str, int]:
        raw = load_json(self.path).get("assignments", {})
        return {str(k): int(v) for k, v in raw.items() if str(v).isdigit()}

    def assignments(self) -> dict[str, int]:
        return self._load()

    def allocate(self, key: str) -> int:
        """Return key's stable port, assigning the lowest free pool port if new."""
        a = self._load()
        if key in a:
            return a[key]
        used = set(a.values())
        port = next((p for p in range(self.start, self.end + 1) if p not in used), None)
        if port is None:
            raise RuntimeError(f"port pool {self.start}-{self.end} exhausted")
        a[key] = port
        write_json(self.path, {"assignments": a})
        return port

    def release(self, key: str) -> None:
        a = self._load()
        if a.pop(key, None) is not None:
            write_json(self.path, {"assignments": a})
