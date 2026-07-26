"""Small filesystem + JSON helpers shared across modules."""
from __future__ import annotations

import json
import logging
import os
import threading
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def load_json(path: Path) -> dict[str, Any]:
    """Read a JSON object; return {} for missing or malformed files (never raise)."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}
    except Exception as e:  # noqa: BLE001
        logger.warning("bad JSON in %s: %s", path.name, e)
        return {}


def atomic_write(path: Path, text: str) -> None:
    """Write via a per-writer temp file + os.replace, so a reader never sees a half-written
    file AND two concurrent writers cannot destroy each other's temp.

    The temp name carries pid+thread id. A fixed ``<name>.tmp`` made this atomic only for a
    single writer: dod writes ``ports.json`` from the sampler thread *and* from every
    ThreadingHTTPServer handler thread (``registry.load`` → ``PortAllocator.allocate``), so
    two writers shared one temp path — the first ``os.replace`` consumed it and the second
    raised ``FileNotFoundError``. ``registry.load`` caught that as "provider failed", which
    dropped every dashboard that provider owns out of ``/api/state`` for a tick.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f"{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    try:
        tmp.write_text(text, encoding="utf-8")
        tmp.replace(path)
    except BaseException:
        tmp.unlink(missing_ok=True)     # never leave a partial temp behind
        raise


def write_json(path: Path, obj: Any) -> None:
    atomic_write(path, json.dumps(obj, indent=2))
