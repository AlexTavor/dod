"""serve() must not touch shared state until the port is actually ours.

Starting a second dod on a busy port is a normal, expected mistake. It must fail cleanly and
leave the daemon already serving that port completely untouched.
"""
from __future__ import annotations

import socket
from pathlib import Path
from typing import Any

from dod.app import App
from dod.config import HOST, Paths


def _busy_port() -> tuple[socket.socket, int]:
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((HOST, 0))
    s.listen(1)
    return s, s.getsockname()[1]


class _SpyApp(App):
    """Records whether the teardown path ran."""

    def __init__(self, *a: Any, **kw: Any) -> None:
        super().__init__(*a, **kw)
        self.shutdown_calls = 0

    def shutdown(self, *_a: object) -> None:
        self.shutdown_calls += 1
        super().shutdown()


def test_a_failed_bind_returns_nonzero_and_tears_nothing_down(tmp_path: Path) -> None:
    sock, port = _busy_port()
    try:
        app = _SpyApp(Paths.create(tmp_path), providers=[])
        # Stand in for the live daemon's connection file.
        app.paths.server.write_text('{"pid": 999}', encoding="utf-8")

        assert app.serve(port) == 1
        assert app.shutdown_calls == 0, "teardown ran despite never owning the port"
        assert app.paths.server.read_text(encoding="utf-8") == '{"pid": 999}', (
            "a failed start deleted the running daemon's server.json"
        )
    finally:
        sock.close()


def test_a_failed_bind_does_not_write_its_own_runtime_files(tmp_path: Path) -> None:
    sock, port = _busy_port()
    try:
        paths = Paths.create(tmp_path)
        app = App(paths, providers=[])
        assert app.serve(port) == 1
        assert not paths.server.exists(), "claimed the port it failed to bind"
    finally:
        sock.close()
