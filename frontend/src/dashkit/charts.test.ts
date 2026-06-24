import { describe, expect, it } from 'vitest';

import type { Panel } from '../types';
import { renderSpec } from './index';

function render1(p: Panel): HTMLElement {
  const el = document.createElement('div');
  renderSpec({ panels: [p] }, el);
  return el;
}

describe('chart atom', () => {
  it('bars: one rect per data point, in a full-width panel', () => {
    const el = render1({ type: 'chart', kind: 'bars', x: ['a', 'b', 'c'], series: [{ values: [1, 2, 3] }] });
    expect(el.querySelector('.dk-chart')?.classList.contains('dk-full')).toBe(true);
    expect(el.querySelectorAll('svg rect').length).toBe(3);
  });

  it('line (the default kind): a polyline plus a dot per point', () => {
    const el = render1({ type: 'chart', x: ['a', 'b', 'c'], series: [{ values: [1, 2, 3] }] });
    expect(el.querySelectorAll('svg polyline').length).toBe(1);
    expect(el.querySelectorAll('svg circle').length).toBe(3);
  });

  it('area (single series): a filled polygon under the line', () => {
    const el = render1({ type: 'chart', kind: 'area', x: ['a', 'b'], series: [{ values: [1, 2] }] });
    expect(el.querySelectorAll('svg polygon').length).toBe(1);
    expect(el.querySelectorAll('svg polyline').length).toBe(1);
  });

  it('multi-series: a legend entry per series and grouped bars', () => {
    const el = render1({
      type: 'chart',
      kind: 'bars',
      x: ['a', 'b'],
      series: [
        { name: 'x', values: [1, 2] },
        { name: 'y', values: [3, 4] },
      ],
    });
    expect(el.querySelectorAll('.dk-legend span').length).toBe(2);
    expect(el.querySelectorAll('svg rect').length).toBe(4); // 2 series x 2 points
  });

  it('spark: a path for >=2 points, rendered as a tile (not full-width)', () => {
    const el = render1({ type: 'chart', kind: 'spark', series: [{ values: [1, 2, 3] }] });
    expect(el.querySelector('.dk-chart')?.classList.contains('dk-full')).toBe(false);
    expect(el.querySelectorAll('svg path').length).toBe(1);
  });

  it('spark with <2 points renders an empty svg (no path) without throwing', () => {
    const el = render1({ type: 'chart', kind: 'spark', series: [{ values: [5] }] });
    expect(el.querySelectorAll('svg path').length).toBe(0);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('hbar: one rect per value', () => {
    const el = render1({ type: 'chart', kind: 'hbar', x: ['a', 'b', 'c'], series: [{ values: [3, 1, 2] }] });
    expect(el.querySelectorAll('svg rect').length).toBe(3);
  });

  it('diverging: one bar rect per value', () => {
    const el = render1({ type: 'chart', kind: 'diverging', x: ['a', 'b'], series: [{ values: [0.5, -0.5] }] });
    expect(el.querySelectorAll('svg rect').length).toBe(2);
  });

  it('a marker draws one dashed line at a matching x label', () => {
    const el = render1({
      type: 'chart',
      kind: 'line',
      x: ['a', 'b', 'c'],
      series: [{ values: [1, 2, 3] }],
      markers: [{ x: 'b', label: 'here', tone: 'accent' }],
    });
    const dashed = Array.from(el.querySelectorAll('svg line')).filter((l) => l.getAttribute('stroke-dasharray'));
    expect(dashed.length).toBe(1);
  });

  it('renders the title and does not crash on empty data', () => {
    const el = render1({ type: 'chart', kind: 'bars', title: 'Counts' });
    expect(el.querySelector('.dk-l')?.textContent).toContain('Counts');
    expect(el.querySelector('svg')).not.toBeNull();
  });
});
