import { describe, expect, it } from 'vitest';

import { DAG_DEFAULTS, edgesOf, layoutDag, type DagInputNode } from './dag-layout';

const { nodeH, minW, scale, gap, rowGap, pad } = DAG_DEFAULTS;
const rowStep = nodeH + rowGap;
const wOf = (weight = 1): number => Math.max(minW, weight * scale - gap);

describe('edgesOf', () => {
  it('derives edges from dependsOn (prerequisite → dependent)', () => {
    expect(edgesOf([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }])).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('merges explicit edges with dependsOn and dedupes', () => {
    const e = edgesOf([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }], [{ from: 'a', to: 'b' }]);
    expect(e).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('drops self-loops and edges to unknown ids', () => {
    expect(edgesOf([{ id: 'a', dependsOn: ['a', 'ghost'] }])).toEqual([]);
  });
});

describe('layoutDag ranks', () => {
  it('ranks a linear chain by depth', () => {
    const l = layoutDag([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }, { id: 'c', dependsOn: ['b'] }]);
    expect(Object.fromEntries(l.nodes.map((n) => [n.id, n.rank]))).toEqual({ a: 0, b: 1, c: 2 });
  });

  it('takes the longest path at a diamond join', () => {
    const l = layoutDag([
      { id: 'a' },
      { id: 'b', dependsOn: ['a'] },
      { id: 'c', dependsOn: ['a'] },
      { id: 'd', dependsOn: ['b', 'c'] },
    ]);
    expect(Object.fromEntries(l.nodes.map((n) => [n.id, n.rank]))).toEqual({ a: 0, b: 1, c: 1, d: 2 });
  });
});

describe('layoutDag earliest-start axis', () => {
  it('places each node at its weighted earliest start', () => {
    const l = layoutDag([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }, { id: 'c', dependsOn: ['b'] }]);
    expect(Object.fromEntries(l.nodes.map((n) => [n.id, n.x]))).toEqual({
      a: pad,
      b: pad + scale,
      c: pad + 2 * scale,
    });
  });

  it('positions by weighted start, so a heavy prerequisite pushes its dependent right', () => {
    const l = layoutDag([
      { id: 'a', weight: 3 },
      { id: 'b', dependsOn: ['a'], weight: 1 },
    ]);
    const byId = Object.fromEntries(l.nodes.map((n) => [n.id, n]));
    expect(byId.a.x).toBe(pad);
    expect(byId.b.x).toBe(pad + 3 * scale); // b starts only after a's 3 units
    expect(byId.a.w).toBe(wOf(3)); // width encodes weight
  });

  it('stacks two independent roots in separate lanes at the same x', () => {
    const l = layoutDag([{ id: 'a' }, { id: 'b' }]);
    const byId = Object.fromEntries(l.nodes.map((n) => [n.id, n]));
    expect([byId.a.x, byId.b.x]).toEqual([pad, pad]);
    expect([byId.a.y, byId.b.y]).toEqual([pad, pad + rowStep]);
  });

  it('reuses an earlier lane once a node clears the box that held it', () => {
    // In a → b → c, c starts well past a's right edge, so it folds back onto a's lane rather
    // than opening a third: the height is two lanes, not three. This lane reuse is what keeps
    // the graph compact instead of one lane per node.
    const l = layoutDag([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }, { id: 'c', dependsOn: ['b'] }]);
    expect(Math.max(...l.nodes.map((n) => n.lane))).toBe(1);
    expect(l.height).toBe(pad * 2 + 2 * nodeH + rowGap);
  });
});

describe('layoutDag float and critical path', () => {
  // a(1) → b(1) → d(1) is the long chain; a → c(1) → d, but c has slack because the a→b→d
  // branch is longer than a→c→d? both are length-2 here, so build an asymmetric one:
  // a(2) → b(2) → d ; a → c(1) → d. The top branch costs 4, the c branch costs 1, so c floats.
  const g: DagInputNode[] = [
    { id: 'a', weight: 2 },
    { id: 'b', weight: 2, dependsOn: ['a'] },
    { id: 'c', weight: 1, dependsOn: ['a'] },
    { id: 'd', weight: 1, dependsOn: ['b', 'c'] },
  ];

  it('marks the longest chain critical and everything off it non-critical', () => {
    const crit = new Set(layoutDag(g).nodes.filter((n) => n.critical).map((n) => n.id));
    expect(crit).toEqual(new Set(['a', 'b', 'd']));
  });

  it('gives a slack node a float bar and a critical node none', () => {
    const byId = Object.fromEntries(layoutDag(g).nodes.map((n) => [n.id, n]));
    expect(byId.c.slack).toBeGreaterThan(0);
    expect(byId.c.floatEndX).toBeGreaterThan(byId.c.x + byId.c.w);
    expect(byId.b.slack).toBe(0);
    expect(byId.b.floatEndX).toBe(byId.b.x + byId.b.w); // no bar
  });

  it('flags the edges of the critical chain and not the others', () => {
    const e = layoutDag(g).edges;
    const crit = new Set(e.filter((x) => x.critical).map((x) => `${x.from}${x.to}`));
    expect(crit).toEqual(new Set(['ab', 'bd']));
  });
});

describe('layoutDag edges', () => {
  it('joins the right face of the source to the left face of the target, no waypoints', () => {
    const l = layoutDag([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }]);
    const e = l.edges[0];
    expect(e).toMatchObject({ from: 'a', to: 'b', x1: pad + wOf(1), x2: pad + scale, back: false });
    expect('waypoints' in e).toBe(false);
  });
});

describe('layoutDag cycle safety', () => {
  it('lays out a 2-cycle without hanging and flags a back-edge', () => {
    const l = layoutDag([
      { id: 'a', dependsOn: ['b'] },
      { id: 'b', dependsOn: ['a'] },
    ]);
    expect(l.nodes).toHaveLength(2);
    expect(l.edges.some((e) => e.back)).toBe(true);
  });

  it('returns an empty layout for no nodes', () => {
    expect(layoutDag([])).toEqual({ nodes: [], edges: [], width: 0, height: 0 });
  });
});
