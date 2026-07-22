import { describe, expect, it } from 'vitest';

import type { Spec } from '../types';
import { refreshDelay, renderSpec } from './index';

describe('renderSpec', () => {
  it('renders a title plus section and stat atoms into the element', () => {
    const el = document.createElement('div');
    const spec: Spec = {
      title: 'Counter',
      panels: [
        { type: 'section', title: 'Overview' },
        { type: 'stat', label: 'count', value: 42 },
      ],
    };
    renderSpec(spec, el);

    expect(el.classList.contains('dk-root')).toBe(true);
    expect(el.querySelector('.dk-title')?.textContent).toContain('Counter');
    expect(el.querySelector('.dk-sec')?.textContent).toContain('Overview');
    const stat = el.querySelector('.dk-stat');
    expect(stat?.querySelector('.dk-l')?.textContent).toContain('count');
    expect(stat?.querySelector('.dk-n')?.textContent).toContain('42');
  });

  it('renders an unknown atom as a labelled fallback rather than throwing', () => {
    const el = document.createElement('div');
    renderSpec({ panels: [{ type: 'mystery' }] }, el);
    expect(el.textContent).toContain('unknown atom: mystery');
  });

  it('escapes text bindings so a spec value cannot inject markup', () => {
    const el = document.createElement('div');
    renderSpec({ panels: [{ type: 'stat', label: '<img src=x onerror=alert(1)>', value: 1 }] }, el);
    expect(el.querySelector('img')).toBeNull(); // the tag is inert text, not a real element
    expect(el.querySelector('.dk-l')?.textContent).toContain('<img');
  });

  it('renders nothing but the grid for an empty spec (no-op safety)', () => {
    const el = document.createElement('div');
    renderSpec({ panels: [] }, el);
    expect(el.querySelector('.dk-panels')?.children.length ?? 0).toBe(0);
    expect(el.querySelector('.dk-title')).toBeNull();
  });

  // Panels are keyed by id, so inserting one above a stateful atom must move that atom's DOM
  // rather than hand it to a different panel. Unkeyed, Lit reuses by position and the form
  // below would be re-bound to the newly inserted panel, silently clearing what was typed.
  it('keeps a keyed panel’s live DOM when a panel is inserted above it', () => {
    const el = document.createElement('div');
    const form: Spec['panels'][number] = {
      type: 'form',
      id: 'edit',
      fields: [{ key: 'name', kind: 'text' }],
    };
    renderSpec({ panels: [form] }, el);
    const before = el.querySelector('dk-form');
    expect(before).not.toBeNull();

    renderSpec({ panels: [{ type: 'section', id: 'hdr', title: 'New' }, form] }, el);
    expect(el.querySelector('dk-form')).toBe(before); // same element, not a fresh one
  });

  it('reuses by position for panels with no id, matching the previous behaviour', () => {
    const el = document.createElement('div');
    renderSpec({ panels: [{ type: 'stat', label: 'a', value: 1 }] }, el);
    const first = el.querySelector('.dk-stat');
    renderSpec({ panels: [{ type: 'stat', label: 'b', value: 2 }] }, el);
    expect(el.querySelector('.dk-stat')).toBe(first);
    expect(el.querySelector('.dk-l')?.textContent).toContain('b');
  });
});

describe('refreshDelay', () => {
  it('uses the spec’s own refresh_ms ahead of the mount option', () => {
    expect(refreshDelay({ panels: [], refresh_ms: 1500 }, 9000)).toBe(1500);
  });

  it('falls back to the mount option, then to the default', () => {
    expect(refreshDelay({ panels: [] }, 9000)).toBe(9000);
    expect(refreshDelay({ panels: [] }, undefined)).toBe(3000);
    expect(refreshDelay(null, undefined)).toBe(3000);
  });

  it('clamps a hostile or nonsensical cadence to the floor', () => {
    expect(refreshDelay({ panels: [], refresh_ms: 1 }, undefined)).toBe(250);
    expect(refreshDelay({ panels: [], refresh_ms: 250 }, undefined)).toBe(250); // exactly at it
    expect(refreshDelay({ panels: [], refresh_ms: 251 }, undefined)).toBe(251);
  });

  it('ignores a zero, negative or non-numeric refresh_ms and falls through', () => {
    expect(refreshDelay({ panels: [], refresh_ms: 0 }, 4000)).toBe(4000);
    expect(refreshDelay({ panels: [], refresh_ms: -5 }, 4000)).toBe(4000);
    expect(refreshDelay({ panels: [], refresh_ms: NaN }, 4000)).toBe(4000);
  });
});
