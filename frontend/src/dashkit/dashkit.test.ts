import { describe, expect, it, vi } from 'vitest';

import type { Spec } from '../types';
import { mount, refreshDelay, renderSpec } from './index';

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

  // Panel ids are only unique WITHIN a spec, and producers reuse them across specs by design
  // (every PDD plan dashboard emits its graph as id "plan"). The namespace is what stops one
  // project's spec from inheriting another's DOM when both render into the same element.
  it('keeps two sources apart when they reuse the same panel id', () => {
    const el = document.createElement('div');
    renderSpec({ panels: [{ type: 'stat', id: 'plan', label: 'A', value: 1 }] }, el, undefined, 'a');
    const first = el.querySelector('.dk-stat');
    renderSpec({ panels: [{ type: 'stat', id: 'plan', label: 'B', value: 2 }] }, el, undefined, 'b');
    expect(el.querySelector('.dk-stat')).not.toBe(first); // fresh DOM: no state carried across
    expect(el.textContent).toContain('B');
  });

  it('still reuses a keyed panel’s DOM within one source (no-op safety)', () => {
    const el = document.createElement('div');
    renderSpec({ panels: [{ type: 'stat', id: 'plan', label: 'x', value: 1 }] }, el, undefined, 'a');
    const first = el.querySelector('.dk-stat');
    renderSpec({ panels: [{ type: 'stat', id: 'plan', label: 'x', value: 2 }] }, el, undefined, 'a');
    expect(el.querySelector('.dk-stat')).toBe(first); // same source → updated in place
  });
});

describe('mount', () => {
  /** A fetch that never settles: the window where a mount has started but has no spec yet. */
  const pendingFetch = (): void => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>(() => {})));
  };

  it('clears the host before its first render, so the previous dashboard cannot linger', () => {
    const el = document.createElement('div');
    renderSpec({ panels: [{ type: 'stat', label: 'project-a-only', value: 1 }] }, el, undefined, 'a');
    expect(el.textContent).toContain('project-a-only');

    pendingFetch();
    const h = mount({ renderUrl: '/api/render?id=b', mount: el });
    // Project B's first poll is still in flight — A must already be gone, not left standing
    // under B's header until (or unless) that poll ever resolves.
    expect(el.textContent).not.toContain('project-a-only');
    h.stop();
    vi.unstubAllGlobals();
  });

  it('clears the host on stop, so a stopped mount leaves nothing behind', () => {
    const el = document.createElement('div');
    pendingFetch();
    const h = mount({ renderUrl: '/api/render?id=a', mount: el });
    renderSpec({ panels: [{ type: 'stat', label: 'still-here', value: 1 }] }, el, undefined, '/api/render?id=a');
    expect(el.textContent).toContain('still-here');
    h.stop();
    expect(el.textContent).not.toContain('still-here');
    vi.unstubAllGlobals();
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
