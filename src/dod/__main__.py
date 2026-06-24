"""Entry point. Dispatch:

    dod                      run the server (default port 8090)
    dod --port N             run the server on N
    dod <subcommand> …       drive a running dod over HTTP (ls, start, stop, forget, …)
    dod daemon install|…     manage the launchd agent
    dod init                 seed $DOD_HOME/registry.json from the bundled example
"""
from __future__ import annotations

import argparse
import shutil
import sys

from . import cli, daemon
from .app import App
from .config import DEFAULT_PORT, EXAMPLE_REGISTRY, Paths


def _init(paths: Paths) -> int:
    paths.ensure()
    if paths.registry.exists():
        print(f"dod: registry already exists at {paths.registry} (leaving it alone)")
        return 0
    if EXAMPLE_REGISTRY.exists():
        shutil.copyfile(EXAMPLE_REGISTRY, paths.registry)
        print(f"dod: seeded {paths.registry} from the example — edit it to add your dashboards")
    else:
        paths.registry.write_text('{"entries": []}\n', encoding="utf-8")
        print(f"dod: wrote empty registry at {paths.registry}")
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else list(argv)
    paths = Paths.create()
    if argv and argv[0] == "daemon":
        return daemon.run(argv[1:], paths)
    if argv and argv[0] == "init":
        return _init(paths)
    if argv and argv[0] in cli.CLI_COMMANDS:
        return cli.run(argv, paths)
    ap = argparse.ArgumentParser(
        prog="dod", description="dod — dashboard-of-dashboards meta-server + CLI.",
        epilog="subcommands: " + " ".join(cli.CLI_COMMANDS) + " | daemon | init")
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = ap.parse_args(argv)
    return App(paths).serve(args.port)


if __name__ == "__main__":
    raise SystemExit(main())
