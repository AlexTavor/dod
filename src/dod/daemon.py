"""`dod daemon install|uninstall|status` — run dod as an always-on launchd agent.

This is the other half of the "die with dod" control model: children are killed when
dod exits, AND dod is kept alive by launchd (KeepAlive). If dod is SIGKILLed, launchd
restarts it and reap_on_boot() re-adopts the survivors into the kill set — so the
single-gate property holds even across an unclean crash.
"""
from __future__ import annotations

import os
import plistlib
import subprocess
import sys
from pathlib import Path

from .config import DEFAULT_PORT, Paths

LABEL = "com.dod.daemon"


def plist_path() -> Path:
    return Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"


def _program_args(port: int) -> list[str]:
    # sys.executable is the interpreter dod is currently running under (the project venv
    # when installed with `uv pip install -e .`), so `-m dod` resolves the package.
    return [sys.executable, "-m", "dod", "--port", str(port)]


def build_plist(paths: Paths, port: int) -> dict:
    log = paths.run / "daemon.log"
    paths.ensure()
    env = {"DOD_HOME": str(paths.home),
           "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin")}
    return {
        "Label": LABEL,
        "ProgramArguments": _program_args(port),
        "EnvironmentVariables": env,
        "RunAtLoad": True,
        "KeepAlive": True,
        "ProcessType": "Background",
        "StandardOutPath": str(log),
        "StandardErrorPath": str(log),
    }


def install(paths: Paths, port: int = DEFAULT_PORT) -> int:
    pp = plist_path()
    pp.parent.mkdir(parents=True, exist_ok=True)
    with pp.open("wb") as f:
        plistlib.dump(build_plist(paths, port), f)
    subprocess.run(["launchctl", "unload", str(pp)], capture_output=True)
    r = subprocess.run(["launchctl", "load", "-w", str(pp)], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"dod: launchctl load failed: {r.stderr.strip()}")
        return 1
    print(f"dod daemon installed → {pp}")
    print(f"     label {LABEL} · port {port} · KeepAlive on · log {paths.run / 'daemon.log'}")
    return 0


def uninstall(paths: Paths) -> int:
    pp = plist_path()
    subprocess.run(["launchctl", "unload", str(pp)], capture_output=True)
    if pp.exists():
        pp.unlink()
        print(f"dod daemon uninstalled ({pp} removed)")
    else:
        print("dod daemon not installed")
    return 0


def status(paths: Paths) -> int:
    pp = plist_path()
    if not pp.exists():
        print("dod daemon: not installed")
        return 1
    r = subprocess.run(["launchctl", "list"], capture_output=True, text=True)
    line = next((ln for ln in r.stdout.splitlines() if LABEL in ln), None)
    print(f"dod daemon: installed ({pp})")
    print(f"     launchctl: {line.strip() if line else 'loaded but not listed (not running?)'}")
    return 0


def run(argv: list[str], paths: Paths | None = None) -> int:
    paths = paths or Paths.create()
    action = argv[0] if argv else "status"
    if action == "install":
        port = int(argv[argv.index("--port") + 1]) if "--port" in argv else DEFAULT_PORT
        return install(paths, port)
    if action == "uninstall":
        return uninstall(paths)
    if action == "status":
        return status(paths)
    print(f"dod daemon: unknown action {action!r}; try install | uninstall | status")
    return 2
