"""Liveness sampler — recomputes every dashboard's state on a fixed cadence.

PARALLEL by design: deck's sampler was a serial loop, so one wedged port consumed its
full probe timeout on every tick and stale-ied the whole board. Here each entry is
probed concurrently in a thread pool, so a single hung dashboard can't freeze the rest.
"""
from __future__ import annotations

import threading
from concurrent.futures import ThreadPoolExecutor
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .app import App
    from .models import State

INTERVAL_S = 2.0
MAX_WORKERS = 16


def sample_once(app: App) -> dict[str, State]:
    entries = app.registry.load()
    if not entries:
        return {}
    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(entries))) as ex:
        results = list(ex.map(lambda e: (e["id"], app.supervisor.state(e)), entries.values()))
    return dict(results)


def run_sampler(app: App, stop_event: threading.Event) -> None:
    while not stop_event.is_set():
        try:
            snap = sample_once(app)
            with app.lock:
                app.states = snap
            app.discovery.prune_dead()
        except Exception as ex:  # noqa: BLE001
            print(f"dod: sampler error: {ex}")
        stop_event.wait(INTERVAL_S)
