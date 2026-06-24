"""Typed shapes for the JSON-shaped dicts that flow across dod's seams.

These are ``TypedDict``s, not dataclasses, on purpose: every shape here is read from
or written to JSON (disk files, HTTP bodies, the spec proxy), so it must stay a plain
``dict`` at runtime. TypedDict gives the type checker the keys without changing a single
byte of runtime behaviour — exactly what a behaviour-preserving migration needs. Frozen
dataclasses remain the right tool where behaviour attaches to data (see ``Paths`` in
config.py, ``PortAllocator`` in ports.py); they would only add serialization friction
here.

Most shapes are ``total=False`` because the code builds them incrementally (literal +
``setdefault`` + later key assignments) and reads optional keys with ``.get``. Where a
key is genuinely always present, a ``total=True`` base class makes it required.
"""
from __future__ import annotations

from typing import TypedDict


class ReadySpec(TypedDict, total=False):
    """A readiness probe spec: how to decide a child is up."""
    kind: str           # "http" | "port"
    path: str           # for kind=="http"
    status: int         # expected HTTP status


class _EntryRequired(TypedDict):
    """The two keys every validated entry is guaranteed to carry."""
    id: str
    type: str           # "web" | "web-external" | "terminal"


class Entry(_EntryRequired, total=False):
    """A registry entry: both the launch contract and the catalog card.

    ``id`` and ``type`` are always present (post-``validate``); everything else is
    optional and defaulted by ``registry.validate``.
    """
    name: str
    blurb: str
    why: str
    tags: list[str]
    cmd: list[str]
    cwd: str
    env: dict[str, str]
    port: int | None
    ready: ReadySpec
    ready_timeout_s: int
    stop: str           # "sigterm" | "sigterm-then-kill" | "leave"
    singleton: bool
    source: str         # "registry" | "local" | "provider:<name>"
    provider: str
    state_override: str  # "archived"
    _comment: str


class Lockfile(TypedDict, total=False):
    """The per-child durable ownership handle written to ``run/<id>.json``."""
    pid: int
    pgid: int | None
    port: int | None
    cmd: list[str]
    started_at: float


class CrashMark(TypedDict, total=False):
    """``run/<id>.crash.json`` — a death that survives a dod restart."""
    exit: int | None
    at: float
    note: str


class StopMark(TypedDict, total=False):
    """``run/<id>.stop.json`` — a deliberate clean stop."""
    kind: str
    at: float


class StopReason(TypedDict, total=False):
    """The user-facing ``last_stop_reason`` projected onto a stopped entry."""
    kind: str           # "clean" | "crash" | "port-busy"
    exit: int | None


class State(TypedDict, total=False):
    """The liveness snapshot the sampler computes per entry and the UI renders."""
    id: str
    name: str
    blurb: str
    why: str
    tags: list[str]
    type: str
    port: int | None
    cmd: list[str]
    source: str
    provider: str
    stop: str
    embeddable: bool
    controllable: bool
    log_tail: str
    render: str         # "spec" | "iframe"
    state: str          # detailed: ready|external|starting|unhealthy|launched|crashed|stopped|…
    status: str         # projected: "live" | "stopped"
    last_stop_reason: StopReason | None
    exit: int | None
    crash_note: str
    launched_at: float


class Discovered(TypedDict, total=False):
    """A contract-speaker seen but not yet pinned (``discovered.json``)."""
    id: str
    port: int
    render: str
    name: str
    blurb: str
    why: str
    announced_at: float


class Meta(TypedDict, total=False):
    """A child's ``/api/meta`` response (the dashkit/dod-kit contract marker)."""
    contract: str
    render: str
    name: str
    blurb: str
    why: str
    accepts_actions: bool
    refresh_ms: int
    version: str


class ActionResult(TypedDict, total=False):
    """The result of a supervisor/registry mutation (start/stop/forget/…)."""
    ok: bool
    error: str
    detail: str
    state: str
    note: str
    id: str
