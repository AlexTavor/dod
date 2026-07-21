"""Provider protocol.

A provider turns *something in the world* into dashboard entries dynamically, instead
of you hand-registering each one. ``discover(paths)`` returns a list of registry-shaped
dicts; the Registry validates and merges them (durable/local entries win on id
collision). Providers own nothing at runtime — they just describe what *could* run; the
supervisor still launches and kills via the normal lifecycle.

``reserved`` carries the ports already bound by hand-registered entries and by providers
that ran earlier in the same pass. A provider that *allocates* ports must route around it;
one whose ports are author-declared can ignore it. Only the Registry sees every source, so
the reservation set is threaded down rather than recomputed per provider — and it cannot be
repaired afterwards, because a provider bakes its port into the argv it emits.
"""
from __future__ import annotations

from typing import Protocol

from ..config import Paths
from ..models import Entry


class Provider(Protocol):
    name: str

    def discover(self, paths: Paths, reserved: frozenset[int] = frozenset()) -> list[Entry]:
        ...
