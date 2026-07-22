"""PDD build plan -> dashkit spec. Pure: a dict in, a spec dict out, no I/O and no clock.

A ``.pdd/plan.json`` is a DAG of build units. PDD's own viewer draws it as a gantt with
x = dependency depth, which reads as a schedule and is not one: two bars at different x may
be perfectly co-runnable, so the axis asserts an ordering the plan does not contain. This
emits the same plan as a ``dag`` atom instead, where an edge is drawn only where a real
dependency exists.

The plan vocabulary here is PDD's (``items`` with ``depends_on``/``phase``/``track``/``size``/
``risk``/``status``), which is what the repos dod actually watches use. Nothing in this module
is hoops-specific.

Only atoms already in the dashkit contract are emitted, so this needs no spec change: the
graph is a ``dag`` panel and everything else is ``stat`` / ``table`` / ``log``.
"""
from __future__ import annotations

from typing import Any

# PDD size letter -> a rough relative weight, used only to report how much of the plan is
# done. It is a proxy for effort, not a duration, and nothing in the graph depends on it.
SIZE_WEIGHT: dict[str, int] = {"S": 1, "M": 2, "L": 3}

# PDD status -> the dashkit lifecycle word the dag atom understands. PDD writes 'pending' and
# 'done'; the rest are accepted because the CLI has emitted them at various points. Anything
# not in this table is passed through untouched, which the atom treats as unrecognised and so
# neither finished nor startable -- uncertainty must not paint a unit as ready.
STATUS_WORD: dict[str, str] = {
    "pending": "queued",
    "todo": "queued",
    "in_progress": "in-progress",
    "in-progress": "in-progress",
    "active": "in-progress",
    "blocked": "blocked",
    "done": "done",
    "landed": "done",
    "green": "green",
    "error": "error",
}


def items_of(plan: dict[str, Any]) -> list[dict[str, Any]]:
    """The plan's units. Tolerates a non-list ``items`` and drops anything without an id."""
    raw = plan.get("items")
    if not isinstance(raw, list):
        return []
    return [i for i in raw if isinstance(i, dict) and i.get("id")]


def deps_of(item: dict[str, Any]) -> list[str]:
    """An item's prerequisite ids, tolerating a missing or malformed ``depends_on``."""
    raw = item.get("depends_on")
    return [str(d) for d in raw if isinstance(d, str)] if isinstance(raw, list) else []


def status_word(status: Any) -> str:
    """Map a PDD status to a dashkit lifecycle word, passing unknown words through."""
    s = str(status or "").strip().lower()
    return STATUS_WORD.get(s, s)


def dangling_deps(items: list[dict[str, Any]]) -> list[tuple[str, str]]:
    """(item id, missing prerequisite id) pairs. A dep pointing at no unit is a plan error:
    the atom silently drops such an edge, so the unit would look startable when it is not."""
    ids = {str(i["id"]) for i in items}
    return [(str(i["id"]), d) for i in items for d in deps_of(i) if d not in ids]


def cycle_nodes(items: list[dict[str, Any]]) -> list[str]:
    """Ids that never reach in-degree zero, i.e. are trapped in a dependency cycle."""
    ids = {str(i["id"]) for i in items}
    indeg = {str(i["id"]): len([d for d in deps_of(i) if d in ids]) for i in items}
    outs: dict[str, list[str]] = {k: [] for k in ids}
    for i in items:
        for d in deps_of(i):
            if d in ids:
                outs[d].append(str(i["id"]))
    queue = [k for k, v in indeg.items() if v == 0]
    seen = 0
    while queue:
        u = queue.pop()
        seen += 1
        for v in outs[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return sorted(k for k, v in indeg.items() if v > 0) if seen < len(ids) else []


def _sub(item: dict[str, Any]) -> str:
    """The node's second line: where it sits and how big it is, compactly."""
    bits = [str(item[k]) for k in ("track", "size") if item.get(k)]
    if item.get("critical"):
        bits.append("critical")
    return " · ".join(bits)


def dag_nodes(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One dag node per unit, in plan order."""
    return [
        {
            "id": str(i["id"]),
            "label": str(i.get("title") or i["id"]),
            "status": status_word(i.get("status")),
            "sub": _sub(i),
            "dependsOn": deps_of(i),
        }
        for i in items
    ]


def ready_ids(items: list[dict[str, Any]]) -> list[str]:
    """Units that can start now: not begun, and every prerequisite done. Mirrors the atom's
    own frontier rule, and is fail-closed the same way -- an unrecognised status is neither
    a finished prerequisite nor itself startable."""
    done = {str(i["id"]) for i in items if status_word(i.get("status")) in ("done", "green")}
    out = []
    for i in items:
        if status_word(i.get("status")) not in ("queued",):
            continue
        if all(d in done for d in deps_of(i)):
            out.append(str(i["id"]))
    return out


def spec_from_plan(plan: dict[str, Any], repo: str = "") -> dict[str, Any]:
    """Render a PDD plan as a dashkit spec: headline counts, the graph, and the ready list."""
    items = items_of(plan)
    title = str(plan.get("title") or repo or "build plan")
    if not items:
        return {"title": title, "panels": [
            {"type": "log", "title": "no plan",
             "text": f"No usable items in this plan ({repo or 'unknown repo'})."}]}

    done = [i for i in items if status_word(i.get("status")) in ("done", "green")]
    ready = ready_ids(items)
    weight = sum(SIZE_WEIGHT.get(str(i.get("size", "")).upper(), 1) for i in items)
    done_weight = sum(SIZE_WEIGHT.get(str(i.get("size", "")).upper(), 1) for i in done)

    panels: list[dict[str, Any]] = [
        {"type": "stat", "label": "units", "value": len(items),
         "sub": f"{len(done)} done"},
        {"type": "stat", "label": "ready now", "value": len(ready), "color": 1},
        {"type": "stat", "label": "phases", "value": len(plan.get("phases") or [])},
        {"type": "progress", "label": "plan complete (size-weighted)",
         "value": done_weight, "max": weight},
        {"type": "dag", "id": "plan", "title": "dependency graph",
         "nodes": dag_nodes(items)},
    ]

    if ready:
        by_id = {str(i["id"]): i for i in items}
        panels.append({
            "type": "table", "title": "startable now",
            "columns": ["id", "title", "track", "size", "risk"],
            "rows": [[r, str(by_id[r].get("title", "")), str(by_id[r].get("track", "")),
                      str(by_id[r].get("size", "")), str(by_id[r].get("risk", ""))]
                     for r in ready],
        })

    # Plan health. A dangling dep or a cycle changes what "ready" means, so it is reported
    # rather than left for the reader to infer from a graph that quietly dropped an edge.
    problems = []
    for node, missing in dangling_deps(items):
        problems.append(f"{node} depends on {missing!r}, which is not a unit in this plan")
    cyc = cycle_nodes(items)
    if cyc:
        problems.append(f"dependency cycle involving: {', '.join(cyc)}")
    if problems:
        panels.append({"type": "log", "title": "plan health", "lines": problems})

    return {"title": title, "panels": panels}
