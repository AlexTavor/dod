"""dod — a dashboard of dashboards.

One local supervisor that registers, launches, and frames every other local dashboard
in one admin UI. Children die with dod; dod runs as a launchd agent. See README.md.
"""
from __future__ import annotations

__version__ = "0.1.0"

from .app import App
from .config import Paths

__all__ = ["App", "Paths", "__version__"]
