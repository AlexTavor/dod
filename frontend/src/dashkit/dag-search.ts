// Free-text search over a dag's units. Pure: nodes and a query in, matching ids out, so the
// matching rule is directly testable and <dk-dag> stays a renderer (mirrors dag-model.ts).

import type { DagNode } from '../types';

/** Everything about a unit a search should see: what the graph draws (id, label, sub, status)
 *  and everything the inspector would show if you selected it (fact values, note, refs).
 *
 *  Searching id and label alone would make you open a unit to find out whether it was the one
 *  you wanted, which is the work the search is meant to remove: a plan's producer puts the
 *  track, the phase, the size, the risk and the brief in `detail`, and those are what you
 *  actually search by ("everything in the solver track", "anything high risk").
 *
 *  Two things are deliberately left out, both for the same reason: a search should be over what
 *  tells one unit apart from another, and boilerplate every unit carries tells you nothing while
 *  swamping the units that do match.
 *
 *  - Fact KEYS. They are the schema, not the unit. Every unit in a PDD plan has a `risk` fact,
 *    so including keys made "risk" match all 35 units of a real plan, not the high-risk ones.
 *  - Reference PROSE (`refs[].text`). A ref's body is usually shared context, not this unit's:
 *    a PDD plan hangs the phase goal and exit criteria off every unit in the phase, so on a real
 *    57-unit plan "physics" returned 19 units, of which 14 matched nothing but a phase goal that
 *    happened to mention physics. Ref LABELS stay: "PR #214" is this unit's and worth finding.
 *
 *  Both remain readable in the inspector. They are context to read once you have arrived at a
 *  unit, not an attribute to find it by. */
export function haystack(n: DagNode): string {
  const d = n.detail ?? {};
  const parts: Array<string | undefined> = [
    n.id,
    n.label,
    n.sub,
    n.status,
    ...(d.facts ?? []).map((f) => String(f.v)),
    d.note,
    ...(d.refs ?? []).map((r) => r.label),
  ];
  return parts.filter((s): s is string => !!s).join('\n').toLowerCase();
}

/** The query's terms, lowercased. Whitespace separates them; an all-whitespace query has none. */
export const terms = (query: string): string[] => query.toLowerCase().split(/\s+/).filter(Boolean);

/**
 * Ids whose text contains every term (AND across terms, substring within one), so narrowing a
 * search is a matter of typing another word.
 *
 * An empty query yields an empty set, NOT every id. No query is not a search for everything,
 * it is no search at all, and the caller must be able to tell "not searching" from "searched
 * and nothing matched" — the two look opposite on screen (nothing dimmed vs everything dimmed).
 */
export function matches(nodes: DagNode[], query: string): Set<string> {
  const ts = terms(query);
  if (!ts.length) return new Set();
  const out = new Set<string>();
  for (const n of nodes) {
    const h = haystack(n);
    if (ts.every((t) => h.includes(t))) out.add(n.id);
  }
  return out;
}

/** Hits in reading order along the earliest-start axis (left to right, then top to bottom), so
 *  stepping through them walks the plan forward instead of following whatever order the
 *  producer happened to emit its units in. An id with no placement is dropped. */
export function ordered(
  ids: ReadonlySet<string>,
  placed: ReadonlyArray<{ id: string; x: number; y: number }>,
): string[] {
  return placed
    .filter((p) => ids.has(p.id))
    .slice()
    .sort((a, b) => a.x - b.x || a.y - b.y || a.id.localeCompare(b.id))
    .map((p) => p.id);
}
