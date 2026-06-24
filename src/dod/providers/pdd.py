"""PDD provider — one dod, every PDD repo's dashboards.

PDD is one product that operates *per repo*: a ``.pdd/`` working dir (like ``.git/``)
with a findings dashboard and a plan dashboard, both shipped inside the PDD CLI so they
"run on any target repo's .pdd/". Their default ports are hardcoded (4317 / 4318), so two
PDD repos collide. This provider scans for ``.pdd/`` repos and emits one entry per
(repo × dashboard), with dod assigning a stable unique port to each — which is the whole
reason this belongs as a provider in the *one* dod rather than a dod-per-project.

Configuration (optional) at ``$DOD_HOME/providers/pdd.json``:
    {"enabled": true,
     "cli": "/Users/.../proof-driven-development/cli/bin/pdd.ts",
     "roots": ["/Users/you/Documents/Alex", "/Users/you"],
     "dashboards": ["findings", "plan"],
     "max_depth": 4}
If ``cli`` is missing or not found on disk, the provider yields nothing (cleanly disabled).
"""
from __future__ import annotations

import re
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

from ..config import Paths
from ..models import Entry
from ..ports import PortAllocator
from ..util import load_json

# kind → (pdd subcommand, human label, default upstream port for reference)
KINDS = {
    "findings": ("dashboard", "findings"),
    "plan": ("plan", "plan"),
}
PRUNE = {"node_modules", ".git", ".venv", "venv", "dist", "build", ".vite",
         "__pycache__", ".next", "target", ".cache"}


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9_-]", "-", s.lower()).strip("-")[:32] or "repo"


def find_pdd_repos(roots: list[Path], max_depth: int = 4) -> list[Path]:
    """Bounded scan: dirs containing a ``.pdd/`` working dir (config.yaml or constitution.md)."""
    seen: set[Path] = set()
    out: list[Path] = []

    def is_pdd_working_dir(p: Path) -> bool:
        return (p / "config.yaml").exists() or (p / "constitution.md").exists()

    def walk(d: Path, depth: int) -> None:
        if depth > max_depth:
            return
        try:
            children = list(d.iterdir())
        except (PermissionError, NotADirectoryError, FileNotFoundError):
            return
        pdd = d / ".pdd"
        if pdd.is_dir() and is_pdd_working_dir(pdd) and d not in seen:
            seen.add(d)
            out.append(d)
        for c in children:
            if c.is_dir() and not c.is_symlink() and c.name not in PRUNE and not c.name.startswith("."):
                walk(c, depth + 1)

    for root in roots:
        root = Path(root).expanduser()
        if root.is_dir():
            walk(root, 0)
    return out


class PddProvider:
    name = "pdd"

    def __init__(self, config: dict[str, Any] | None = None,
                 repo_finder: Callable[[list[Path], int], list[Path]] = find_pdd_repos,
                 ttl: float = 60.0) -> None:
        self.config = config or {}
        self._find = repo_finder
        self.ttl = ttl                 # discover() runs every sampler tick — cache the fs scan
        self._cache: list[Entry] | None = None
        self._cache_at = 0.0

    @classmethod
    def from_paths(cls, paths: Paths) -> PddProvider:
        cfg = load_json(paths.home / "providers" / "pdd.json")
        return cls(cfg)

    def discover(self, paths: Paths) -> list[Entry]:
        now = time.monotonic()
        if self._cache is not None and (now - self._cache_at) < self.ttl:
            return self._cache
        self._cache = self._scan(paths)
        self._cache_at = now
        return self._cache

    def _scan(self, paths: Paths) -> list[Entry]:
        cfg = self.config
        if cfg.get("enabled") is False:
            return []
        cli = cfg.get("cli")
        if not cli or not Path(cli).expanduser().exists():
            return []                                   # cleanly disabled until configured
        cli = str(Path(cli).expanduser())
        roots = [Path(r).expanduser() for r in cfg.get("roots") or [Path.home() / "Documents"]]
        kinds = [k for k in (cfg.get("dashboards") or ["findings", "plan"]) if k in KINDS]
        repos = self._find(roots, int(cfg.get("max_depth", 4)))

        alloc = PortAllocator(paths.ports)
        slugs: dict[str, Path] = {}
        for r in repos:
            s = _slug(r.name)
            if s in slugs:                              # disambiguate cli/.pdd vs repo/.pdd
                s = _slug(f"{r.parent.name}-{r.name}")
            slugs[s] = r

        entries: list[Entry] = []
        for slug, repo in sorted(slugs.items()):
            for kind in kinds:
                sub, label = KINDS[kind]
                eid = f"pdd-{slug}-{kind}"
                port = alloc.allocate(eid)
                entries.append({
                    "id": eid,
                    "name": f"PDD · {repo.name} · {label}",
                    "blurb": f"{label} dashboard for {repo.name} (.pdd, read-only viewer)",
                    "why": f"PDD {label} viewer over {repo}/.pdd — managed by dod so it gets a "
                           f"unique port and dies with dod.",
                    "tags": ["pdd", slug],
                    "type": "web",
                    "cmd": ["node", cli, sub, str(repo), "--port", str(port), "--no-open"],
                    "cwd": str(repo),
                    "port": port,
                    "ready": {"kind": "http", "path": "/", "status": 200},
                    "ready_timeout_s": 25,
                    "stop": "sigterm",
                    "singleton": True,
                })
        return entries
