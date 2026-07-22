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
import sys
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

# `dag` is ours, not PDD's: the same .pdd/plan.json rendered as a dependency graph through
# the dod-kit contract, so dod draws it natively instead of framing PDD's gantt. It needs no
# node and no PDD CLI, so it stays available even when `cli` is unset -- see _dag_entry.
DAG_KIND = "dag"
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
        self._cache_reserved: frozenset[int] = frozenset()

    @classmethod
    def from_paths(cls, paths: Paths) -> PddProvider:
        cfg = load_json(paths.home / "providers" / "pdd.json")
        return cls(cfg)

    def discover(self, paths: Paths, reserved: frozenset[int] = frozenset()) -> list[Entry]:
        now = time.monotonic()
        # The cache keys on `reserved` too: a newly-claimed port must re-scan rather than
        # serve an assignment made when that port still looked free.
        cached = self._cache
        if (cached is not None and (now - self._cache_at) < self.ttl
                and self._cache_reserved == reserved):
            return cached
        self._cache = self._scan(paths, reserved)
        self._cache_at = now
        self._cache_reserved = reserved
        return self._cache

    def _dag_entry(self, slug: str, repo: Path, port: int) -> Entry:
        """The plan as a native dag spec, served by our own stdlib kit. No node, no PDD CLI."""
        return {
            "id": f"pdd-{slug}-{DAG_KIND}",
            "name": f"PDD · {repo.name} · plan graph",
            "blurb": f"{repo.name}'s build plan as a dependency graph (.pdd/plan.json).",
            "why": f"The same plan PDD draws as a gantt, drawn as the DAG it actually is: an "
                   f"edge only where {repo.name} declares a real dependency, so what can be "
                   f"worked in parallel is readable instead of implied by a depth axis.",
            "tags": ["pdd", slug, "plan"],
            "type": "web",
            "cmd": [sys.executable, "-m", "dod.plankit", str(repo), "--port", str(port)],
            "cwd": str(repo),
            "port": port,
            "ready": {"kind": "http", "path": "/", "status": 200},
            "ready_timeout_s": 15,
            "stop": "sigterm",
            "singleton": True,
        }

    def _scan(self, paths: Paths, reserved: frozenset[int] = frozenset()) -> list[Entry]:
        cfg = self.config
        if cfg.get("enabled") is False:
            return []
        requested = cfg.get("dashboards") or ["findings", "plan"]
        want_dag = DAG_KIND in requested

        # The node dashboards need PDD's CLI on disk; the dag view does not. Missing cli
        # therefore disables those kinds rather than the whole provider.
        cli_path = Path(str(cfg["cli"])).expanduser() if cfg.get("cli") else None
        cli = str(cli_path) if cli_path and cli_path.exists() else None
        kinds = [k for k in requested if k in KINDS] if cli else []
        if not kinds and not want_dag:
            return []                                   # cleanly disabled until configured

        roots = [Path(r).expanduser() for r in cfg.get("roots") or [Path.home() / "Documents"]]
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
            if want_dag:
                eid = f"pdd-{slug}-{DAG_KIND}"
                entries.append(self._dag_entry(slug, repo, alloc.allocate(eid, reserved)))
            if cli:
                for kind in kinds:
                    eid = f"pdd-{slug}-{kind}"
                    entries.append(self._node_entry(
                        slug, repo, kind, cli, alloc.allocate(eid, reserved)))
        return entries

    @staticmethod
    def _node_entry(slug: str, repo: Path, kind: str, cli: str, port: int) -> Entry:
        """One of PDD's own dashboards, run from the PDD CLI and framed by dod."""
        sub, label = KINDS[kind]
        return {
            "id": f"pdd-{slug}-{kind}",
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
        }
