// Pure derivations over a fix-dependency graph: which lifecycle bucket a status falls in, the
// prerequisite/dependent adjacency, a node's reachable lineage, and the actionable frontier.
// No Lit and no colours live here, so each piece is directly testable and <dk-dag> stays a
// thin renderer (mirrors app/status.ts and app/reorder.ts).

import type { DagEdge, DagNode } from '../types';

export type Bucket = 'idle' | 'active' | 'good' | 'warn' | 'err';

/** What one recognised status word means. Three independent facts, none inferable from
 *  another: `bucket` is presentation, `satisfies` and `notBegun` are the readiness logic. */
interface StatusFacts {
  /** Lifecycle bucket, for the node colour and the legend. */
  bucket: Bucket;
  /** The work is finished, so this unit no longer blocks its dependents. */
  satisfies: boolean;
  /** The work has not begun, so this unit may be offered as startable. */
  notBegun: boolean;
}

// status word → what it means. Covers carve UnitState (queued/planning/in-cycle/green/
// blocked/needs-HITL/landed/done) and the remediation state (pending/in-progress/green/
// needs-hitl/committed/error). Data-by-key with an explicit fallback per CLAUDE.md.
//
// `bucket` and the two predicates are bundled in one row rather than kept as parallel
// tables, so a new status word cannot be given a colour while its readiness meaning is
// silently left to a default.
const STATUS: Record<string, StatusFacts> = {
  queued: { bucket: 'idle', satisfies: false, notBegun: true },
  pending: { bucket: 'idle', satisfies: false, notBegun: true },
  planning: { bucket: 'active', satisfies: false, notBegun: false },
  'in-cycle': { bucket: 'active', satisfies: false, notBegun: false },
  'in-progress': { bucket: 'active', satisfies: false, notBegun: false },
  green: { bucket: 'good', satisfies: true, notBegun: false },
  landed: { bucket: 'good', satisfies: true, notBegun: false },
  committed: { bucket: 'good', satisfies: true, notBegun: false },
  done: { bucket: 'good', satisfies: true, notBegun: false },
  blocked: { bucket: 'warn', satisfies: false, notBegun: false },
  'needs-hitl': { bucket: 'warn', satisfies: false, notBegun: false },
  error: { bucket: 'err', satisfies: false, notBegun: false },
};

// The fallback for a word this atom does not know. It paints as not-started, because some
// colour must be chosen, but it is NEITHER satisfied NOR startable: an unrecognised status
// can never unblock a dependent and can never be offered as ready.
//
// This split is the whole point. `bucket` alone used to carry both meanings, so any unknown
// word fell back to 'idle' and 'idle' was itself the eligibility test — a unit whose real
// state was "claimed by another session" or "waiting on contention" got the ready ring and
// invited an operator to take work already in hand. Producers own their own vocabulary and
// will always have words dashkit has not seen; uncertainty must block, never unblock.
const UNKNOWN: StatusFacts = { bucket: 'idle', satisfies: false, notBegun: false };

const factsOf = (status?: string): StatusFacts => STATUS[(status ?? '').toLowerCase()] ?? UNKNOWN;

/** The lifecycle bucket for a status word; unknown or missing words paint as not-started. */
export const bucketOf = (status?: string): Bucket => factsOf(status).bucket;

/** Whether a status means the work is finished, so dependents are no longer blocked by it. */
export const satisfies = (status?: string): boolean => factsOf(status).satisfies;

/** Whether a status means the work has not begun, so the unit may be offered as startable. */
export const notBegun = (status?: string): boolean => factsOf(status).notBegun;

export interface Adjacency {
  /** id → its prerequisites (edges pointing in). */
  up: Map<string, string[]>;
  /** id → its dependents (edges pointing out). */
  down: Map<string, string[]>;
}

/** Prerequisite/dependent maps. Every id gets an entry; an edge touching an unknown id is dropped. */
export function adjacency(ids: string[], edges: DagEdge[]): Adjacency {
  const up = new Map<string, string[]>();
  const down = new Map<string, string[]>();
  for (const id of ids) {
    up.set(id, []);
    down.set(id, []);
  }
  for (const e of edges) {
    if (!up.has(e.from) || !up.has(e.to)) continue;
    down.get(e.from)!.push(e.to);
    up.get(e.to)!.push(e.from);
  }
  return { up, down };
}

/** Every id reachable from `start` along `adj`, excluding `start` itself. */
export function reach(start: string, adj: Map<string, string[]>): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const u = stack.pop()!;
    for (const v of adj.get(u) ?? [])
      if (!seen.has(v)) {
        seen.add(v);
        stack.push(v);
      }
  }
  return seen;
}

/** A node plus its prerequisites and dependents, transitively (for hover highlighting). */
export function lineage(id: string, adj: Adjacency): Set<string> {
  return new Set<string>([id, ...reach(id, adj.up), ...reach(id, adj.down)]);
}

/** Ids that can start now: the work has not begun and every prerequisite is finished. Both
 *  tests are explicit status facts, never the colour bucket, so an unrecognised word neither
 *  counts as a finished prerequisite nor is itself offered as ready. */
export function frontier(nodes: DagNode[], up: Map<string, string[]>): Set<string> {
  const done = new Set(nodes.filter((n) => satisfies(n.status)).map((n) => n.id));
  const out = new Set<string>();
  for (const n of nodes) {
    if (!notBegun(n.status)) continue;
    if ((up.get(n.id) ?? []).every((p) => done.has(p))) out.add(n.id);
  }
  return out;
}
