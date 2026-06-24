import { describe, expect, it } from 'vitest';

import type { Spec } from '../types';
import { renderSpec } from './index';

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
});
