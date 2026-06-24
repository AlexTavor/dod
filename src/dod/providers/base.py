"""Provider protocol.

A provider turns *something in the world* into dashboard entries dynamically, instead
of you hand-registering each one. ``discover(paths)`` returns a list of registry-shaped
dicts; the Registry validates and merges them (durable/local entries win on id
collision). Providers own nothing at runtime — they just describe what *could* run; the
supervisor still launches and kills via the normal lifecycle.
"""
from __future__ import annotations

from typing import Protocol

from ..config import Paths
from ..models import Entry


class Provider(Protocol):
    name: str

    def discover(self, paths: Paths) -> list[Entry]:
        ...
