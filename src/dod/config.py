"""Configuration: constants and the resolved set of on-disk paths.

dod is a *cross-project* daemon — it supervises dashboards living in many repos
(rapport, job-search, PDD targets, …). So its state does NOT live inside any one
project; it lives in a user-global home, ``~/.dod`` by default (override with the
``DOD_HOME`` env var, which is also how the tests get an isolated home).

The durable registry (your real dashboards) is *user data* at ``$DOD_HOME/registry.json``
— it is intentionally not committed to this product repo. ``examples/registry.example.json``
ships a generic illustration instead. dod only ever WRITES ``local.json`` / ``state.json``
/ ``discovered.json`` / lockfiles — never ``registry.json``; that read-only boundary is
the trust model carried over from deck.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path

HOST = "127.0.0.1"
DEFAULT_PORT = 8090
CONTRACT = "dod-kit/1"          # current native-spec marker in /api/meta
# Accepted markers: the kit (dod-kit/1) and its predecessor dashkit/1 (same spec shape),
# so the engine recognizes both. fetch_meta / announce gate on membership, not equality.
CONTRACTS = frozenset({"dod-kit/1", "dashkit/1"})
LOG_CAP = 2_000_000            # bytes; cap captured child logs
ID_RE = re.compile(r"^[a-z0-9_-]+$")

PKG_DIR = Path(__file__).resolve().parent
WEB_DIR = PKG_DIR / "web"
EXAMPLE_REGISTRY = PKG_DIR.parent.parent / "examples" / "registry.example.json"


def default_home() -> Path:
    return Path(os.environ.get("DOD_HOME") or (Path.home() / ".dod"))


@dataclass(frozen=True)
class Paths:
    """All on-disk locations, derived from one home dir. Construct via ``Paths.create()``."""
    home: Path

    @classmethod
    def create(cls, home: Path | str | None = None) -> "Paths":
        return cls(home=Path(home) if home else default_home())

    @property
    def registry(self) -> Path:        # durable, user-owned (dod reads only)
        return self.home / "registry.json"

    @property
    def local(self) -> Path:           # runtime/adopted entries (dod writes)
        return self.home / "local.json"

    @property
    def state(self) -> Path:           # archive-state overlay {id: {state}}
        return self.home / "state.json"

    @property
    def discovered(self) -> Path:      # contract-speakers seen but not yet pinned
        return self.home / "discovered.json"

    @property
    def ports(self) -> Path:           # provider port assignments (stable across restarts)
        return self.home / "ports.json"

    @property
    def token(self) -> Path:           # per-boot secret, mode 600
        return self.home / "token"

    @property
    def server(self) -> Path:          # non-secret connection info for the CLI
        return self.home / "server.json"

    @property
    def run(self) -> Path:             # per-child lockfiles, logs, crash markers
        return self.home / "run"

    def lock(self, eid: str) -> Path:
        return self.run / f"{eid}.json"

    def log(self, eid: str) -> Path:
        return self.run / f"{eid}.log"

    def crash(self, eid: str) -> Path:
        return self.run / f"{eid}.crash.json"

    def ensure(self) -> "Paths":
        self.home.mkdir(parents=True, exist_ok=True)
        self.run.mkdir(parents=True, exist_ok=True)
        return self


# Files in the home dir that are NOT child lockfiles (so reap-on-boot skips them).
RESERVED_FILES = {"local.json", "state.json", "server.json", "discovered.json",
                  "registry.json", "ports.json", "token"}
