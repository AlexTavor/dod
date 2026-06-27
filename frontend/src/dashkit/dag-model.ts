// Pure derivations over a fix-dependency graph: which lifecycle bucket a status falls in, the
// prerequisite/dependent adjacency, a node's reachable lineage, and the actionable frontier.
// No Lit and no colours live here, so each piece is directly testable and <dk-dag> stays a
// thin renderer (mirrors app/status.ts and app/reorder.ts).

import type { DagEdge, DagNode } from '../types';

export type Bucket = 'idle' | 'active' | 'good' | 'warn' | 'err';

// status word → lifecycle bucket. Covers carve UnitState (queued/planning/in-cycle/green/
// blocked/needs-HITL/landed/done) and the remediation state (pending/in-progress/green/
// needs-hitl/committed/error). Data-by-key with a fallback per CLAUDE.md.
const STATUS_BUCKET: Record<string, Bucket> = {
  queued: 'idle',
  pending: 'idle',
  planning: 'active',
  'in-cycle': 'active',
  'in-progress': 'active',
  green: 'good',
  landed: 'good',
  committed: 'good',
  done: 'good',
  blocked: 'warn',
  'needs-hitl': 'warn',
  error: 'err',
};

/** The lifecycle bucket for a status word; unknown or missing words read as not-started. */
export const bucketOf = (status?: string): Bucket =>
  STATUS_BUCKET[(status ?? '').toLowerCase()] ?? 'idle';

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

/** Ids that can start now: not begun (idle) and every prerequisite already done (good). */
export function frontier(nodes: DagNode[], up: Map<string, string[]>): Set<string> {
  const done = new Set(nodes.filter((n) => bucketOf(n.status) === 'good').map((n) => n.id));
  const out = new Set<string>();
  for (const n of nodes) {
    if (bucketOf(n.status) !== 'idle') continue;
    if ((up.get(n.id) ?? []).every((p) => done.has(p))) out.add(n.id);
  }
  return out;
}
