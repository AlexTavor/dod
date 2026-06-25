"""Structured logging for the always-on daemon.

dod's runtime *diagnostics* — registry validation, provider failures, supervisor
boot reconciliation, the sampler loop — go through the stdlib ``logging`` module
instead of bare ``print``: leveled, timestamped, and tee'd to a logfile. CLI
subcommands (``dod ls``, ``dod add``, ``dod init``, ``dod daemon …``) and the
foreground startup banner keep printing to stdout, since those are a command's
direct result to the user, not daemon telemetry.

Modules log under the ``dod`` hierarchy via ``logging.getLogger(__name__)``
(``dod.registry``, ``dod.sampler``, …); this configures their shared parent. Only
the daemon configures logging, once, at :meth:`dod.app.App.serve` — importing dod
never touches global logging state. Level comes from ``$DOD_LOG_LEVEL`` (default
``INFO``); records go to stderr (a foreground run shows them live; under launchd
they are captured into the daemon log) and to ``$DOD_HOME/run/dod.log``.
"""
from __future__ import annotations

import logging
import os
import sys

from .config import Paths

LOGGER_NAME = "dod"
LOGFILE = "dod.log"
DEFAULT_LEVEL = "INFO"
_FORMAT = "%(asctime)s %(levelname)-8s %(name)s: %(message)s"


def _resolve_level(level: str | None) -> int:
    name = (level or os.environ.get("DOD_LOG_LEVEL") or DEFAULT_LEVEL).upper()
    resolved = logging.getLevelName(name)        # name -> int, or the str back if unknown
    return resolved if isinstance(resolved, int) else logging.INFO


def configure_logging(paths: Paths, level: str | None = None) -> logging.Logger:
    """Configure the shared ``dod`` logger and return it. Idempotent.

    A second call (a daemon reload, a second test) finds handlers already attached
    and returns immediately, so handlers never stack. The logfile is best-effort:
    if it cannot be opened, logging continues to stderr rather than failing boot.
    """
    logger = logging.getLogger(LOGGER_NAME)
    if logger.handlers:                          # already configured — don't double up
        return logger
    logger.setLevel(_resolve_level(level))
    logger.propagate = False                     # we own the dod hierarchy; don't echo via root
    fmt = logging.Formatter(_FORMAT)

    stream = logging.StreamHandler(sys.stderr)
    stream.setFormatter(fmt)
    logger.addHandler(stream)

    try:                                         # a logfile is best-effort; never fail boot over it
        paths.run.mkdir(parents=True, exist_ok=True)
        fileh = logging.FileHandler(paths.run / LOGFILE, encoding="utf-8")
        fileh.setFormatter(fmt)
        logger.addHandler(fileh)
    except OSError as e:                          # pragma: no cover - disk/permission edge
        logger.warning("could not open logfile %s: %s", paths.run / LOGFILE, e)

    return logger
