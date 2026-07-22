"""Serve a repo's ``.pdd/plan.json`` as a dashkit spec over the dod-kit contract.

    python -m dod.plankit <repo> --port 4310

The plan is re-read on every render, so editing ``.pdd/plan.json`` shows up on the next poll
without a restart. Read-only: this never writes to the target repo, and the kit exposes no
actions, so there is nothing for a POST to reach.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from . import kit
from .planspec import spec_from_plan


def plan_path(repo: Path) -> Path:
    return repo / ".pdd" / "plan.json"


def load_plan(path: Path) -> dict[str, Any]:
    """The plan, or a raising path. Callers turn failure into a spec, never a crash."""
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"{path} is not a JSON object")
    return data


def render_for(repo: Path) -> dict[str, Any]:
    """The spec for this repo right now. A missing or malformed plan renders as a readable
    panel rather than an exception: the daemon polls this every couple of seconds, and a
    half-written file during an edit must not blank the pane."""
    path = plan_path(repo)
    try:
        return spec_from_plan(load_plan(path), repo.name)
    except FileNotFoundError:
        return {"title": repo.name, "panels": [
            {"type": "log", "title": "no plan",
             "text": f"{path} does not exist. Run `pdd plan` in {repo} to create one."}]}
    except (json.JSONDecodeError, ValueError) as e:
        return {"title": repo.name, "panels": [
            {"type": "log", "title": "unreadable plan", "text": f"{path}\n{e}"}]}


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if not args or args[0].startswith("-"):
        print("usage: python -m dod.plankit <repo> [--port N]", file=sys.stderr)
        return 2
    repo = Path(args[0]).expanduser().resolve()
    port = 0
    if "--port" in args:
        try:
            port = int(args[args.index("--port") + 1])
        except (IndexError, ValueError):
            print("--port needs an integer", file=sys.stderr)
            return 2

    meta = {"name": f"{repo.name} plan", "kind": "spec", "refresh_ms": 4000}
    return kit.serve(meta, lambda: render_for(repo), port)


if __name__ == "__main__":
    raise SystemExit(main())
