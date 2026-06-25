"""App — the object graph (paths, token, registry, supervisor, discovery) and the server
boot/shutdown sequence. Holds the live state snapshot the HTTP layer serves.
"""
from __future__ import annotations

import atexit
import logging
import os
import secrets
import signal
import threading
import time
from collections.abc import Callable
from http.server import ThreadingHTTPServer

from .config import HOST, Paths
from .discovery import Discovery
from .logsetup import configure_logging
from .models import State
from .providers.base import Provider
from .providers.manifest import ManifestProvider
from .providers.pdd import PddProvider
from .registry import Registry
from .sampler import run_sampler
from .supervisor import Supervisor
from .util import load_json, write_json

logger = logging.getLogger(__name__)


def default_providers(paths: Paths) -> list[Provider]:
    return [ManifestProvider.from_paths(paths), PddProvider.from_paths(paths)]


class App:
    def __init__(self, paths: Paths, providers: list[Provider] | None = None,
                 token: str | None = None, clock: Callable[[], float] = time.time) -> None:
        self.paths = paths.ensure()
        # Persistent token: reuse the on-disk one across restarts so an open browser tab
        # stays valid through a daemon reload (per-boot rotation 403'd live tabs silently).
        self.token = token or self._load_or_make_token()
        self.clock = clock
        self.registry = Registry(
            paths, providers=providers if providers is not None else default_providers(paths))
        self.supervisor = Supervisor(paths, self.registry, clock=clock)
        self.discovery = Discovery(paths, self.registry, clock=clock)
        self.lock = threading.Lock()
        self.states: dict[str, State] = {}
        self._serving = False
        self._stop = threading.Event()

    def _load_or_make_token(self) -> str:
        try:
            t = self.paths.token.read_text(encoding="utf-8").strip()
            if t:
                return t
        except FileNotFoundError:
            pass
        return secrets.token_hex(16)

    def snapshot(self) -> list[State]:
        order = load_json(self.paths.order).get("order", [])
        rank = {eid: i for i, eid in enumerate(order)}    # user's drag order; unranked → end, by id
        with self.lock:
            rows = list(self.states.values())
        return sorted(rows, key=lambda r: (rank.get(r["id"], len(rank)), r["id"]))

    def set_order(self, ids: list[str]) -> None:
        write_json(self.paths.order, {"order": [str(i) for i in ids]})

    # ── runtime files (token = the agent-control trust boundary) ────────
    def write_runtime_files(self, port: int) -> None:
        self.paths.token.write_text(self.token, encoding="utf-8")
        self.paths.token.chmod(0o600)
        write_json(self.paths.server,
                   {"url": f"http://{HOST}:{port}", "port": port, "pid": os.getpid(),
                    "started_at": self.clock()})

    def shutdown(self, *_a: object) -> None:
        self.supervisor.shutdown()                  # die-with-dod: kill every owned child
        if self._serving:
            # keep the token across restarts (open tabs stay valid); only drop conn info
            self.paths.server.unlink(missing_ok=True)

    def serve(self, port: int) -> int:
        from .server import make_handler  # late import to avoid cycle
        configure_logging(self.paths)              # daemon owns logging; CLI paths keep printing
        self._serving = True
        atexit.register(self.shutdown)
        self.supervisor.reap_on_boot()             # re-adopt survivors / record deaths
        self.discovery.load()
        self.write_runtime_files(port)
        threading.Thread(target=run_sampler, args=(self, self._stop), daemon=True).start()
        def _on_sigterm(*_a: object) -> None:
            self.shutdown()
            os._exit(0)
        signal.signal(signal.SIGTERM, _on_sigterm)
        n = len(self.registry.load())
        logger.info("serving on http://%s:%s (%d dashboards registered)", HOST, port, n)
        if not self.paths.registry.exists():
            print(f"dod: note no durable registry at {self.paths.registry} (run `dod init` to seed one)")
        print(f"dod → http://{HOST}:{port}   ({n} dashboards registered)")
        print(f"      CLI: dod ls   ·   token → {self.paths.token}")
        try:
            ThreadingHTTPServer((HOST, port), make_handler(self)).serve_forever()
        except KeyboardInterrupt:
            self.shutdown()
        return 0
