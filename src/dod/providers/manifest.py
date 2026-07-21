"""Manifest provider — a project registers by shipping a ``dod.project.json`` file.

This is "all projects register" without a hand-kept central index: a project declares
itself with a manifest at its repo root, dod scans configured roots, aggregates the
manifests into the catalog, and supervises each via its ``run`` block. It is the
generalization of the PDD provider — PDD is just one shape of project.

    dod.project.json:
      {
        "id": "jobsearch",
        "name": "Job Search",
        "description": "Pipeline board for the hunt.",
        "run": {"cmd": ["node","server.js"], "cwd": ".", "port": 4317,
                "ready": {"kind":"http","path":"/","status":200}, "stop": "sigterm"},
        "tags": ["tools"]
      }

A relative ``run.cwd`` resolves against the manifest's directory (the project repo). A
manifest with no ``run.cmd`` is adopt-only (dod frames a port it doesn't launch).
Config at ``$DOD_HOME/providers/manifest.json``: {enabled, roots, max_depth}.
"""
from __future__ import annotations

import logging
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any, cast

from ..config import Paths
from ..models import Entry
from ..util import load_json

logger = logging.getLogger(__name__)

MANIFEST = "dod.project.json"
PRUNE = {"node_modules", ".git", ".venv", "venv", "dist", "build", ".vite",
         "__pycache__", ".next", "target", ".cache"}


def find_manifests(roots: list[Path], max_depth: int = 4) -> list[Path]:
    """Bounded scan for ``dod.project.json`` files under the given roots."""
    out: list[Path] = []
    seen: set[Path] = set()

    def walk(d: Path, depth: int) -> None:
        if depth > max_depth:
            return
        try:
            children = list(d.iterdir())
        except (PermissionError, NotADirectoryError, FileNotFoundError):
            return
        m = d / MANIFEST
        if m.is_file() and m not in seen:
            seen.add(m)
            out.append(m)
        for c in children:
            if c.is_dir() and not c.is_symlink() and c.name not in PRUNE and not c.name.startswith("."):
                walk(c, depth + 1)

    for root in roots:
        root = Path(root).expanduser()
        if root.is_dir():
            walk(root, 0)
    return out


def manifest_to_entry(mpath: Path) -> Entry | None:
    """Convert one manifest file into a registry-shaped entry (None if unusable)."""
    data = load_json(mpath)
    if not data.get("id") or not data.get("name"):
        if data:
            logger.warning("manifest %s missing id/name — skipped", mpath)
        return None
    run = data.get("run") or {}
    cmd = run.get("cmd")
    cmd = cmd if isinstance(cmd, list) else []   # argv list only: a non-list (e.g. a shell string) is no cmd
    cwd = run.get("cwd", ".")
    cwd = str(Path(cwd) if Path(cwd).is_absolute() else (mpath.parent / cwd))
    desc = str(data.get("description", ""))
    launchable = bool(cmd)
    return cast(Entry, {
        "id": data["id"],
        "name": data["name"],
        "blurb": desc,
        "why": desc or "Registered via dod.project.json.",
        "tags": data.get("tags") or [],
        "type": "web" if launchable else "web-external",
        "cmd": cmd,
        "cwd": cwd,
        "env": run.get("env") or {},
        "port": run.get("port"),
        "ready": run.get("ready") or {"kind": "http", "path": "/", "status": 200},
        "ready_timeout_s": run.get("ready_timeout_s", 25),
        "stop": run.get("stop") or ("sigterm" if launchable else "leave"),
        "singleton": run.get("singleton", True),
    })


class ManifestProvider:
    name = "manifest"

    def __init__(self, config: dict[str, Any] | None = None,
                 finder: Callable[[list[Path], int], list[Path]] = find_manifests,
                 ttl: float = 60.0) -> None:
        self.config = config or {}
        self._find = finder
        self.ttl = ttl
        self._cache: list[Entry] | None = None
        self._cache_at = 0.0

    @classmethod
    def from_paths(cls, paths: Paths) -> ManifestProvider:
        return cls(load_json(paths.home / "providers" / "manifest.json"))

    def discover(self, paths: Paths, reserved: frozenset[int] = frozenset()) -> list[Entry]:
        # `reserved` is ignored: a manifest declares its own port, dod does not allocate it.
        # A manifest port that collides is the author's to fix; Registry._lint_ports reports it.
        now = time.monotonic()
        if self._cache is not None and (now - self._cache_at) < self.ttl:
            return self._cache
        self._cache = self._scan()
        self._cache_at = now
        return self._cache

    def _scan(self) -> list[Entry]:
        cfg = self.config
        if cfg.get("enabled") is False:
            return []
        roots = [Path(r).expanduser() for r in cfg.get("roots") or [Path.home() / "Documents"]]
        entries: list[Entry] = []
        for m in self._find(roots, int(cfg.get("max_depth", 4))):
            e = manifest_to_entry(m)
            if e:
                entries.append(e)
        return entries
