import { describe, expect, it } from 'vitest';

import type { Panel } from '../types';
import { renderSpec } from './index';

function render1(p: Panel): HTMLElement {
  const el = document.createElement('div');
  renderSpec({ panels: [p] }, el);
  return el;
}

describe('stateless atoms', () => {
  it('progress computes and clamps the bar width and shows a text', () => {
    const el = render1({ type: 'progress', label: 'done', value: 30, max: 60 });
    const bar = el.querySelector<HTMLElement>('.dk-bar > i');
    expect(parseFloat(bar?.style.width ?? '')).toBeCloseTo(50); // CSSOM normalizes 50.0% -> 50%
    expect(el.querySelector('.dk-sub')?.textContent).toContain('50.0%');
  });

  it('progress clamps over-100% to 100', () => {
    const el = render1({ type: 'progress', value: 200, max: 100 });
    const bar = el.querySelector<HTMLElement>('.dk-bar > i');
    expect(parseFloat(bar?.style.width ?? '')).toBeCloseTo(100);
  });

  it('table marks numeric columns and formats numbers', () => {
    const el = render1({
      type: 'table',
      columns: ['name', 'count'],
      align: ['left', 'num'],
      rows: [['a', 1234]],
    });
    expect(el.querySelectorAll('th')[1]?.classList.contains('num')).toBe(true);
    const numCell = el.querySelectorAll('td')[1];
    expect(numCell?.classList.contains('num')).toBe(true);
    expect(numCell?.textContent).toContain('1,234');
  });

  it('kv renders key/value rows with formatted numbers', () => {
    const el = render1({ type: 'kv', items: [{ k: 'port', v: 8090 }] });
    const row = el.querySelector('.dk-kv .r');
    expect(row?.querySelector('b')?.textContent).toBe('port');
    expect(row?.querySelector('span')?.textContent).toContain('8,090');
  });

  it('log joins lines into a pre block', () => {
    const el = render1({ type: 'log', lines: ['a', 'b'] });
    expect(el.querySelector('pre.dk-log')?.textContent).toBe('a\nb');
  });

  it('badge applies the tone class', () => {
    const el = render1({ type: 'badge', tone: 'ok', text: 'live' });
    const pill = el.querySelector('.dk-pill');
    expect(pill?.classList.contains('ok')).toBe(true);
    expect(pill?.textContent).toContain('live');
  });

  it('prose splits blank-line-separated paragraphs', () => {
    const el = render1({ type: 'prose', text: 'one\n\ntwo' });
    expect(el.querySelectorAll('.dk-prose p').length).toBe(2);
  });

  it('html inserts first-party markup unescaped (the escape hatch)', () => {
    const el = render1({ type: 'html', html: '<b class="x">hi</b>' });
    expect(el.querySelector('b.x')?.textContent).toBe('hi');
  });

  it('stat renders a sparkline when given spark data', () => {
    const el = render1({ type: 'stat', label: 'trend', value: 5, spark: [1, 3, 2, 5] });
    expect(el.querySelector('.dk-stat svg path')).not.toBeNull();
  });

  it('an atom that throws yields an error panel rather than crashing the render', () => {
    const bomb = {
      type: 'stat',
      get label(): string {
        throw new Error('boom');
      },
    } as unknown as Panel;
    const el = render1(bomb);
    expect(el.querySelector('.dk-err')?.textContent).toContain('atom error');
  });
});

describe('injectCSS', () => {
  it('adds the theme <style> exactly once across renders', () => {
    document.getElementById('dk-css')?.remove();
    render1({ type: 'stat', label: 'x', value: 1 });
    render1({ type: 'stat', label: 'y', value: 2 });
    expect(document.querySelectorAll('#dk-css').length).toBe(1);
  });
});
