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


# --- the plan graph, over edges whose endpoints both exist ---------------------------------
# One traversal underlies every graph fact below (cycle detection, topological order, the
# concurrency ceiling, the critical path), so there is a single place the edge set is built.

def _forward(items: list[dict[str, Any]]) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    """Prerequisite (`pred`) and dependent (`succ`) maps, dropping edges to unknown ids."""
    ids = {str(i["id"]) for i in items}
    pred: dict[str, list[str]] = {str(i["id"]): [] for i in items}
    succ: dict[str, list[str]] = {str(i["id"]): [] for i in items}
    for i in items:
        for d in deps_of(i):
            if d in ids:
                pred[str(i["id"])].append(d)
                succ[d].append(str(i["id"]))
    return pred, succ


def _kahn(items: list[dict[str, Any]]) -> tuple[list[str], list[str]]:
    """Kahn's algorithm once: returns (resolved order, ids left in a cycle). Everything that
    needs a topological order or cycle membership is derived from this, never a second sweep."""
    pred, succ = _forward(items)
    indeg = {k: len(v) for k, v in pred.items()}
    queue = sorted(k for k, d in indeg.items() if d == 0)
    order: list[str] = []
    while queue:
        u = queue.pop(0)
        order.append(u)
        for v in succ[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    cyclic = sorted(k for k in indeg if k not in set(order))
    return order, cyclic


def cycle_nodes(items: list[dict[str, Any]]) -> list[str]:
    """Ids trapped in a dependency cycle (never reach in-degree zero)."""
    return _kahn(items)[1]


def _topo(items: list[dict[str, Any]]) -> list[str]:
    """A full ordering: the resolved topological order, then any cycle remnant appended."""
    order, cyclic = _kahn(items)
    return order + cyclic


def _sub(item: dict[str, Any]) -> str:
    """The node's second line: where it sits and how big it is, compactly. Criticality is not
    named here -- the graph draws the critical path in the redline colour, derived by CPM
    rather than trusting the plan's own ``critical`` flag."""
    return " · ".join(str(item[k]) for k in ("track", "size") if item.get(k))


def weight_of(item: dict[str, Any]) -> int:
    """The unit's relative cost, from its size letter. Positions the node on the earliest-start
    axis and sizes its float bar; an unknown size counts as 1."""
    return SIZE_WEIGHT.get(str(item.get("size", "")).upper(), 1)


def _detail(item: dict[str, Any], phases: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """The inspector payload for one unit: scannable facts, the brief, and references to zoom
    into. The phase resolves to its goal and exit criteria; a `delivers` entry (present in some
    producers, not PDD plans) becomes a source link. Waits-on / unblocks are not here -- the
    atom derives those from the graph so its chips can re-select."""
    facts: list[dict[str, str]] = []
    ph = str(item.get("phase") or "")
    pinfo = phases.get(ph, {})
    if ph:
        name = str(pinfo.get("name") or "")
        facts.append({"k": "phase", "v": f"{ph}: {name}" if name else ph})
    facts += [{"k": k, "v": str(item[k])} for k in ("track", "size", "risk") if item.get(k)]
    facts.append({"k": "by", "v": "agent" if item.get("agentic") else "human call"})

    refs: list[dict[str, str]] = []
    if pinfo.get("goal"):
        refs.append({"label": f"Phase {ph} goal", "text": str(pinfo["goal"])})
    if pinfo.get("exit_criteria"):
        refs.append({"label": "Exit criteria", "text": str(pinfo["exit_criteria"])})
    for d in item.get("delivers") or []:
        if isinstance(d, dict) and d.get("pr"):
            ref: dict[str, str] = {"label": f"PR #{d['pr']}"}
            if isinstance(d.get("url"), str):
                ref["href"] = d["url"]
            refs.append(ref)

    detail: dict[str, Any] = {"facts": facts}
    if item.get("note"):
        detail["note"] = str(item["note"])
    if refs:
        detail["refs"] = refs
    return detail


def dag_nodes(
    items: list[dict[str, Any]], phases: list[dict[str, Any]] | None = None
) -> list[dict[str, Any]]:
    """One dag node per unit, in plan order, each carrying its inspector detail."""
    by_phase = {str(p.get("id")): p for p in (phases or []) if isinstance(p, dict)}
    return [
        {
            "id": str(i["id"]),
            "label": str(i.get("title") or i["id"]),
            "status": status_word(i.get("status")),
            "sub": _sub(i),
            "weight": weight_of(i),
            "dependsOn": deps_of(i),
            "detail": _detail(i, by_phase),
        }
        for i in items
    ]


def max_concurrency(items: list[dict[str, Any]]) -> int:
    """The largest set of mutually-independent units: the real ceiling on how many can be
    worked at once. This is the size of the maximum antichain, which by Dilworth's theorem is
    ``n - (maximum matching over the reachability relation)``. Weight-free."""
    _, succ = _forward(items)
    ids = [str(i["id"]) for i in items]
    # reachability: v in reach[u] iff there is a path u -> ... -> v (u ordered before v)
    reach: dict[str, set[str]] = {i: set() for i in ids}
    for u in reversed(list(_topo(items))):
        for v in succ[u]:
            reach[u].add(v)
            reach[u] |= reach[v]
    # maximum bipartite matching of u -> (something reachable from u)
    match: dict[str, str] = {}

    def augment(u: str, seen: set[str]) -> bool:
        for v in reach[u]:
            if v in seen:
                continue
            seen.add(v)
            if v not in match or augment(match[v], seen):
                match[v] = u
                return True
        return False

    matched = sum(1 for u in ids if augment(u, set()))
    return len(ids) - matched


def critical_units(items: list[dict[str, Any]]) -> set[str]:
    """The zero-float units: the chain whose weighted length sets the earliest finish. Derived
    by CPM over the unit weights, so it does not trust the plan's own ``critical`` flag."""
    by = {str(i["id"]): i for i in items}
    pred, succ = _forward(items)
    order = _topo(items)
    w = {k: weight_of(by[k]) for k in by}
    asap: dict[str, int] = dict.fromkeys(by, 0)
    for u in order:
        asap[u] = max((asap[p] + w[p] for p in pred[u]), default=0)
    total = max((asap[k] + w[k] for k in by), default=0)
    late = dict.fromkeys(by, total)
    for u in reversed(order):
        if succ[u]:
            late[u] = min(late[s] - w[s] for s in succ[u])
    return {k for k in by if late[k] - w[k] - asap[k] < 1e-9}


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
    weight = sum(weight_of(i) for i in items)
    done_weight = sum(weight_of(i) for i in done)
    crit = critical_units(items)
    crit_weight = sum(weight_of(i) for i in items if str(i["id"]) in crit)

    panels: list[dict[str, Any]] = [
        {"type": "stat", "label": "units", "value": len(items),
         "sub": f"{len(done)} done"},
        {"type": "stat", "label": "ready now", "value": len(ready), "color": 1},
        # The ceiling on useful parallelism: the most units that can be worked at once. Not a
        # count of anything visible in one column -- it is the largest mutually-independent set.
        {"type": "stat", "label": "max parallel", "value": max_concurrency(items)},
        # The spine: zero-float units, and the weighted length no amount of parallelism beats.
        {"type": "stat", "label": "critical path", "value": len(crit),
         "sub": f"{crit_weight} u"},
        {"type": "stat", "label": "phases", "value": len(plan.get("phases") or [])},
        {"type": "progress", "label": "plan complete (size-weighted)",
         "value": done_weight, "max": weight},
        {"type": "dag", "id": "plan", "title": "dependency graph",
         "nodes": dag_nodes(items, plan.get("phases") or [])},
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
