import { describe, expect, it } from 'vitest';

import { DAG_DEFAULTS, edgesOf, layoutDag } from './dag-layout';

const { nodeW, nodeH, colGap, rowGap, pad } = DAG_DEFAULTS;
const colStep = nodeW + colGap;
const rowStep = nodeH + rowGap;

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

  it('places independent roots in the same rank, stacked', () => {
    const l = layoutDag([{ id: 'a' }, { id: 'b' }]);
    const a = l.nodes.find((n) => n.id === 'a')!;
    const b = l.nodes.find((n) => n.id === 'b')!;
    expect([a.rank, b.rank]).toEqual([0, 0]);
    expect(a.y).toBe(pad);
    expect(b.y).toBe(pad + rowStep);
  });
});

describe('layoutDag geometry', () => {
  it('positions ranks left to right and sizes to content', () => {
    const l = layoutDag([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }, { id: 'c', dependsOn: ['b'] }]);
    expect(Object.fromEntries(l.nodes.map((n) => [n.id, n.x]))).toEqual({
      a: pad,
      b: pad + colStep,
      c: pad + 2 * colStep,
    });
    expect(l.width).toBe(pad * 2 + 3 * nodeW + 2 * colGap);
    expect(l.height).toBe(pad * 2 + nodeH);
  });

  it('connects edge endpoints to the node faces it joins', () => {
    const l = layoutDag([{ id: 'a' }, { id: 'b', dependsOn: ['a'] }]);
    const e = l.edges[0];
    expect({ x1: e.x1, x2: e.x2 }).toEqual({ x1: pad + nodeW, x2: pad + colStep });
    expect(e.back).toBe(false);
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
