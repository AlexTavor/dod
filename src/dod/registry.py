"""The dashboard registry: durable ∪ local ∪ provider entries.

Three sources, merged in precedence order (later wins on id collision):
  1. providers  — dynamically discovered (e.g. one PDD dashboard per .pdd repo)
  2. durable    — ``registry.json`` (user-owned; dod reads only)
  3. local      — ``local.json`` (adopted / ad-hoc; dod writes)

The read-only boundary on the durable file is the trust model: a runtime bug can
never corrupt your hand-curated catalog, only the transient ``local.json``.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any, cast

from .config import ID_RE, Paths
from .models import ActionResult, Entry
from .util import load_json, write_json

if TYPE_CHECKING:
    from .providers.base import Provider

logger = logging.getLogger(__name__)

VALID_KEYS = ("id", "name", "blurb", "why", "tags", "type", "cmd", "cwd", "env",
              "port", "ready", "ready_timeout_s", "stop", "singleton", "source",
              "provider", "_comment")


def validate(e: dict[str, Any], source: str) -> Entry | None:
    """Coerce + default one raw entry; return None (with a logged reason) if unusable."""
    if not isinstance(e, dict) or not ID_RE.match(str(e.get("id", ""))):
        logger.warning("skip entry with bad/missing id in %s: %r", source, e.get("id"))
        return None
    if e.get("type") not in ("web", "web-external", "terminal"):
        logger.warning("skip %s: bad type %r", e["id"], e.get("type"))
        return None
    if not isinstance(e.get("cmd"), list):
        logger.warning("skip %s: cmd must be an argv list, not a shell string", e["id"])
        return None
    if e.get("port") is not None:
        try:
            e["port"] = int(e["port"])
        except (TypeError, ValueError):
            logger.warning("skip %s: bad port %r", e["id"], e.get("port"))
            return None
    for k in list(e):
        if k not in VALID_KEYS:
            logger.info("note %s: ignoring unknown key %r", e["id"], k)
    e.setdefault("tags", [])
    e.setdefault("cwd", ".")
    e.setdefault("env", {})
    e.setdefault("stop", "sigterm")
    e.setdefault("singleton", True)
    e.setdefault("ready", {"kind": "port"})
    e.setdefault("ready_timeout_s", 20)
    e["source"] = e.get("source", source)
    return cast(Entry, e)


class Registry:
    def __init__(self, paths: Paths, providers: list[Provider] | None = None,
                 project_base: Path | None = None) -> None:
        self.paths = paths
        self.providers = list(providers or [])
        # relative cwds resolve against this base; entries should normally be absolute.
        self.project_base = project_base or Path.home()

    def load(self) -> dict[str, Entry]:
        """Merged, validated entries with the archive overlay applied + duplicate-port lint."""
        entries: dict[str, Entry] = {}
        for prov in self.providers:
            try:
                for raw in prov.discover(self.paths):
                    v = validate(dict(raw), f"provider:{prov.name}")
                    if v:
                        v["provider"] = prov.name
                        entries[v["id"]] = v
            except Exception:  # a broken provider must not sink the registry (logged, not swallowed)
                logger.exception("provider %s failed", getattr(prov, "name", "?"))
        for path, src in ((self.paths.registry, "registry"), (self.paths.local, "local")):
            for raw in load_json(path).get("entries", []):
                v = validate(dict(raw), src)
                if v:
                    entries[v["id"]] = v
        overlay = load_json(self.paths.state)
        for eid, st in overlay.items():
            if eid in entries:
                entries[eid]["state_override"] = st.get("state")
        self._lint_ports(entries)
        return entries

    @staticmethod
    def _lint_ports(entries: dict[str, Entry]) -> None:
        seen: dict[int, str] = {}
        for e in entries.values():
            p = e.get("port")
            if e["type"] != "terminal" and p:
                if p in seen:
                    logger.warning("LINT duplicate port %s: %s and %s", p, seen[p], e["id"])
                seen[p] = e["id"]

    def resolve_cwd(self, e: Entry) -> str:
        cwd = e.get("cwd", ".")
        p = Path(cwd)
        return str(p if p.is_absolute() else (self.project_base / cwd))

    def get(self, eid: str) -> Entry | None:
        return self.load().get(eid)

    # ── mutating the local (writable) tier ──────────────────────────────
    def add_local(self, entry: Entry) -> None:
        data = load_json(self.paths.local) or {"entries": []}
        data["entries"] = [x for x in data.get("entries", []) if x.get("id") != entry["id"]]
        data["entries"].append(entry)
        write_json(self.paths.local, data)

    def forget(self, eid: str) -> ActionResult:
        """Permanently drop a *local* entry (the cure for an append-only graveyard).

        Durable and provider entries cannot be forgotten — archive those instead;
        forgetting a provider entry would just reappear on the next discovery scan.
        """
        data = load_json(self.paths.local) or {"entries": []}
        before = len(data.get("entries", []))
        data["entries"] = [x for x in data.get("entries", []) if x.get("id") != eid]
        if len(data["entries"]) == before:
            return {"ok": False, "error": "not a local entry (durable/provider — archive it instead)"}
        write_json(self.paths.local, data)
        self.write_overlay(eid, None)   # drop any stale archive overlay too
        return {"ok": True, "id": eid}

    def write_overlay(self, eid: str, state: str | None) -> None:
        ov = load_json(self.paths.state)
        if state is None:
            ov.pop(eid, None)
        else:
            ov[eid] = {"state": state}
        write_json(self.paths.state, ov)
