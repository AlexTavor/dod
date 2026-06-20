"""App — the object graph (paths, token, registry, supervisor, discovery) and the server
boot/shutdown sequence. Holds the live state snapshot the HTTP layer serves.
"""
from __future__ import annotations

import atexit
import os
import secrets
import signal
import threading
import time
from http.server import ThreadingHTTPServer

from .config import HOST, Paths
from .discovery import Discovery
from .providers.pdd import PddProvider
from .registry import Registry
from .sampler import run_sampler
from .supervisor import Supervisor
from .util import write_json


def default_providers(paths: Paths) -> list:
    return [PddProvider.from_paths(paths)]


class App:
    def __init__(self, paths: Paths, providers=None, token: str | None = None, clock=time.time):
        self.paths = paths.ensure()
        self.token = token or secrets.token_hex(16)
        self.clock = clock
        self.registry = Registry(paths, providers=providers if providers is not None else default_providers(paths))
        self.supervisor = Supervisor(paths, self.registry, clock=clock)
        self.discovery = Discovery(paths, self.registry, clock=clock)
        self.lock = threading.Lock()
        self.states: dict[str, dict] = {}
        self._serving = False
        self._stop = threading.Event()

    def snapshot(self) -> list[dict]:
        with self.lock:
            return sorted(self.states.values(), key=lambda r: r["id"])

    # ── runtime files (token = the agent-control trust boundary) ────────
    def write_runtime_files(self, port: int) -> None:
        self.paths.token.write_text(self.token, encoding="utf-8")
        os.chmod(self.paths.token, 0o600)
        write_json(self.paths.server,
                   {"url": f"http://{HOST}:{port}", "port": port, "pid": os.getpid(),
                    "started_at": self.clock()})

    def shutdown(self, *_a) -> None:
        self.supervisor.shutdown()                  # die-with-dod: kill every owned child
        if self._serving:                           # only the server revokes its own token
            self.paths.token.unlink(missing_ok=True)
            self.paths.server.unlink(missing_ok=True)

    def serve(self, port: int) -> int:
        from .server import make_handler           # late import to avoid cycle
        self._serving = True
        atexit.register(self.shutdown)
        self.supervisor.reap_on_boot()             # re-adopt survivors / record deaths
        self.discovery.load()
        self.write_runtime_files(port)
        threading.Thread(target=run_sampler, args=(self, self._stop), daemon=True).start()
        signal.signal(signal.SIGTERM, lambda *a: (self.shutdown(), os._exit(0)))
        n = len(self.registry.load())
        if not self.paths.registry.exists():
            print(f"dod: note no durable registry at {self.paths.registry} (run `dod init` to seed one)")
        print(f"dod → http://{HOST}:{port}   ({n} dashboards registered)")
        print(f"      CLI: dod ls   ·   token → {self.paths.token}")
        try:
            ThreadingHTTPServer((HOST, port), make_handler(self)).serve_forever()
        except KeyboardInterrupt:
            self.shutdown()
        return 0
