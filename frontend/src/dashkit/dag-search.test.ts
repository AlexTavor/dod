import { describe, expect, it } from 'vitest';

import { haystack, matches, ordered, terms } from './dag-search';
import type { DagNode } from '../types';

// One unit carrying every field a search should see, so a field dropped from `haystack` shows
// up as a missing line rather than as a search that quietly stops finding things.
const full: DagNode = {
  id: 'U7',
  label: 'Wire the auth handshake',
  status: 'queued',
  sub: 'SEC · M',
  detail: {
    facts: [
      { k: 'track', v: 'SEC' },
      { k: 'risk', v: 'high' },
    ],
    note: 'Exchange the token before the first probe.',
    refs: [{ label: 'Phase M2 goal', text: 'no unauthenticated path', href: 'https://x/1' }],
  },
};

const nodes: DagNode[] = [
  full,
  { id: 'a', label: 'Alpha', status: 'done', detail: { facts: [{ k: 'track', v: 'SIM' }] } },
  { id: 'b', label: 'Beta', status: 'queued', detail: { note: 'high risk, no auth involved' } },
];

describe('haystack', () => {
  it('covers the drawn node and every value the inspector would show, lowercased', () => {
    expect(haystack(full)).toBe(
      [
        'u7',
        'wire the auth handshake',
        'sec · m',
        'queued',
        'sec',
        'high',
        'exchange the token before the first probe.',
        'phase m2 goal',
      ].join('\n'),
    );
  });

  // Every unit in a plan has the same fact keys, so a key is not a way to tell them apart.
  it('leaves the fact keys out, so a schema word does not match every unit', () => {
    expect(haystack(full)).not.toContain('track');
    expect(matches([full], 'risk')).toEqual(new Set());
    expect(matches([full], 'high')).toEqual(new Set(['U7'])); // the value still matches
  });

  // A phase goal is hung off every unit in the phase, so its prose is not this unit's either.
  it('leaves reference prose out but keeps the reference label', () => {
    expect(matches([full], 'unauthenticated')).toEqual(new Set());
    expect(matches([full], 'phase m2 goal')).toEqual(new Set(['U7']));
  });

  it('is empty for a bare node and never trips on absent detail', () => {
    expect(haystack({ id: '' })).toBe('');
  });
});

describe('terms', () => {
  it('splits on whitespace and lowercases', () => {
    expect(terms('  Auth   HIGH ')).toEqual(['auth', 'high']);
  });

  it('has no terms for an all-whitespace query', () => {
    expect(terms('   ')).toEqual([]);
  });
});

describe('matches', () => {
  it('matches a substring of the label, case-insensitively', () => {
    expect(matches(nodes, 'HANDSH')).toEqual(new Set(['U7']));
  });

  it('matches on the id', () => {
    expect(matches(nodes, 'u7')).toEqual(new Set(['U7']));
  });

  it('matches on a fact the inspector would show but the graph does not', () => {
    expect(matches(nodes, 'sim')).toEqual(new Set(['a']));
  });

  it('matches on the brief', () => {
    expect(matches(nodes, 'probe')).toEqual(new Set(['U7']));
  });

  it('matches on a reference this unit owns, such as its PR', () => {
    const withPr: DagNode = { id: 'p', detail: { refs: [{ label: 'PR #214', href: 'https://x/214' }] } };
    expect(matches([...nodes, withPr], 'pr #214')).toEqual(new Set(['p']));
  });

  it('ANDs the terms, so a second word narrows across fields', () => {
    // 'auth' alone is in U7's label and in b's note; 'high' is U7's risk fact and b's note.
    expect(matches(nodes, 'auth')).toEqual(new Set(['U7', 'b']));
    expect(matches(nodes, 'auth high')).toEqual(new Set(['U7', 'b']));
    expect(matches(nodes, 'auth handshake')).toEqual(new Set(['U7']));
  });

  it('matches nothing when a term appears nowhere', () => {
    expect(matches(nodes, 'auth zzz')).toEqual(new Set());
  });

  // The no-op path: an absent query is not a search for everything.
  it('matches nothing for an empty or whitespace query', () => {
    expect(matches(nodes, '')).toEqual(new Set());
    expect(matches(nodes, '   ')).toEqual(new Set());
  });

  it('matches nothing when there are no nodes', () => {
    expect(matches([], 'auth')).toEqual(new Set());
  });
});

describe('ordered', () => {
  const placed = [
    { id: 'c', x: 200, y: 0 },
    { id: 'a', x: 0, y: 60 },
    { id: 'b', x: 100, y: 0 },
    { id: 'd', x: 100, y: 60 },
  ];

  it('walks the hits left to right, then top to bottom', () => {
    expect(ordered(new Set(['a', 'b', 'c', 'd']), placed)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('keeps only the hits', () => {
    expect(ordered(new Set(['c', 'a']), placed)).toEqual(['a', 'c']);
  });

  it('drops a hit that was never placed', () => {
    expect(ordered(new Set(['a', 'ghost']), placed)).toEqual(['a']);
  });

  it('is empty with no hits, and leaves its input alone', () => {
    const before = [...placed];
    expect(ordered(new Set(), placed)).toEqual([]);
    expect(placed).toEqual(before);
  });
});
