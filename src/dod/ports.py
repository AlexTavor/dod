"""Stable port assignment.

Providers (e.g. PDD) emit one dashboard *per target repo* from the same binary,
whose own default port is hardcoded — so two targets collide. dod owns port
assignment instead: each logical key gets a port from a pool, persisted to
``ports.json`` so the same dashboard keeps the same port across restarts.

The allocator's own ``ports.json`` only records what it handed out. A hand-registered
entry that hard-codes a port *inside the pool* is invisible to it, so ``allocate`` also
takes the set of ports already claimed elsewhere; see :func:`claimed_ports`.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .config import Paths
from .util import load_json, write_json

POOL_START = 4300
POOL_END = 4399


def _as_port(value: object) -> int | None:
    """A raw ``port`` field as an int, or None. bool is excluded: it is a subclass of int."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def claimed_ports(paths: Paths) -> frozenset[int]:
    """Ports bound by hand-registered entries (durable ``registry.json`` + ``local.json``).

    Read raw, before ``registry.validate``, because this must run inside a provider's
    ``discover`` — the point where a port is chosen, which is before the Registry exists.
    ``terminal`` entries are skipped: they bind no port, matching ``Registry._lint_ports``.
    """
    out: set[int] = set()
    for path in (paths.registry, paths.local):
        for raw in load_json(path).get("entries", []):
            if not isinstance(raw, dict) or raw.get("type") == "terminal":
                continue
            port = _as_port(raw.get("port"))
            if port is not None:
                out.add(port)
    return frozenset(out)


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

    def allocate(self, key: str, reserved: frozenset[int] = frozenset()) -> int:
        """Return key's stable port, assigning the lowest free pool port if new.

        ``reserved`` are ports owned by someone else (:func:`claimed_ports`). A *stored*
        assignment that has since become reserved is reassigned rather than returned: by
        then the collision is already on disk, and handing it back would leave the fix
        inert for exactly the case that motivates it — a durable entry added, or its port
        changed, after the provider entry was first allocated.
        """
        a = self._load()
        current = a.get(key)
        if current is not None and current not in reserved:
            return current
        used = {p for k, p in a.items() if k != key} | reserved
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
