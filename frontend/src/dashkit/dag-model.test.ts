import { describe, expect, it } from 'vitest';

import { adjacency, bucketOf, frontier, lineage, reach } from './dag-model';
import type { DagNode } from '../types';

describe('bucketOf', () => {
  it('classifies carve and remediation statuses', () => {
    expect(bucketOf('queued')).toBe('idle');
    expect(bucketOf('in-progress')).toBe('active');
    expect(bucketOf('committed')).toBe('good');
    expect(bucketOf('blocked')).toBe('warn');
    expect(bucketOf('error')).toBe('err');
  });

  it('is case-insensitive and falls back to idle for unknown or missing words', () => {
    expect(bucketOf('COMMITTED')).toBe('good');
    expect(bucketOf('nonsense')).toBe('idle');
    expect(bucketOf(undefined)).toBe('idle');
  });
});

describe('adjacency', () => {
  it('maps prerequisites (up) and dependents (down)', () => {
    const { up, down } = adjacency(
      ['a', 'b', 'c'],
      [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
    );
    expect(up.get('b')).toEqual(['a']);
    expect(down.get('b')).toEqual(['c']);
    expect(up.get('a')).toEqual([]);
  });

  it('seeds every id and drops edges touching an unknown id', () => {
    const { up } = adjacency(['a'], [{ from: 'a', to: 'ghost' }]);
    expect(up.has('a')).toBe(true);
    expect([...up.values()].every((v) => v.length === 0)).toBe(true);
  });
});

describe('reach and lineage', () => {
  const adj = adjacency(['a', 'b', 'c'], [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }]);

  it('reach walks transitively and excludes the start', () => {
    expect([...reach('a', adj.down)].sort()).toEqual(['b', 'c']);
    expect(reach('a', adj.up).size).toBe(0);
  });

  it('lineage is the node plus its ancestors and descendants', () => {
    expect([...lineage('b', adj)].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('frontier', () => {
  const nodes: DagNode[] = [
    { id: 'a', status: 'done' },
    { id: 'b', status: 'committed' },
    { id: 'c', status: 'queued' }, // prereq a is done → ready
    { id: 'd', status: 'queued' }, // prereq c is not done → blocked
    { id: 'e', status: 'in-progress' }, // already begun → never ready
  ];
  const { up } = adjacency(
    ['a', 'b', 'c', 'd', 'e'],
    [{ from: 'a', to: 'c' }, { from: 'c', to: 'd' }, { from: 'b', to: 'e' }],
  );

  it('rings a not-started node whose prerequisites are all done', () => {
    expect(frontier(nodes, up).has('c')).toBe(true);
  });

  it('excludes a node with an unfinished prerequisite, and a node already begun', () => {
    const f = frontier(nodes, up);
    expect(f.has('d')).toBe(false);
    expect(f.has('e')).toBe(false);
  });

  it('treats a not-started root with no prerequisites as ready', () => {
    expect(frontier([{ id: 'r', status: 'queued' }], adjacency(['r'], []).up).has('r')).toBe(true);
  });
});
