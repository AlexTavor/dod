import { describe, expect, it } from 'vitest';

import { reorder } from './reorder';

describe('reorder', () => {
  it('moves an item later', () => expect(reorder(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a']));
  it('moves an item earlier', () => expect(reorder(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']));
  it('is a no-op when from === to', () => expect(reorder(['a', 'b', 'c'], 'b', 'b')).toEqual(['a', 'b', 'c']));
  it('is a no-op when an id is missing', () => expect(reorder(['a', 'b'], 'x', 'a')).toEqual(['a', 'b']));
  it('does not mutate the input', () => {
    const ids = ['a', 'b', 'c'];
    reorder(ids, 'a', 'b');
    expect(ids).toEqual(['a', 'b', 'c']);
  });
});
