import { describe, expect, it } from 'vitest';

import { DkDag } from './dk-dag';
import type { DagPanel } from '../types';

async function makeDag(panel: DagPanel): Promise<DkDag> {
  const el = document.createElement('dk-dag') as DkDag;
  el.panel = panel;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const nodeById = (el: HTMLElement, id: string): SVGGElement =>
  Array.from(el.querySelectorAll<SVGGElement>('.dk-dag-node')).find(
    (g) => g.querySelector('.dk-dag-lbl')?.textContent?.trim() === id,
  )!;

// a → {b done, c queued}; d depends on b and c. With b done and a done, only b's-side is
// unblocked, so c is the actionable frontier once a is done.
const panel: DagPanel = {
  type: 'dag',
  title: 'Units',
  nodes: [
    { id: 'a', label: 'a', status: 'done' },
    { id: 'b', label: 'b', status: 'done', dependsOn: ['a'] },
    { id: 'c', label: 'c', status: 'queued', dependsOn: ['a'] },
    { id: 'd', label: 'd', status: 'queued', dependsOn: ['b', 'c'], action: 'open' },
  ],
};

describe('dk-dag', () => {
  it('renders one node group and the edges between them', async () => {
    const el = await makeDag(panel);
    expect(el.querySelectorAll('.dk-dag-node').length).toBe(4);
    // a→b, a→c, b→d, c→d
    expect(el.querySelectorAll('.dk-dag-edge').length).toBe(4);
    el.remove();
  });

  it('shows the status legend', async () => {
    const el = await makeDag(panel);
    expect(el.querySelector('.dk-dag-legend')).not.toBeNull();
    expect(el.textContent).toContain('ready now');
    el.remove();
  });

  it('rings the actionable frontier (queued + every prerequisite done)', async () => {
    const el = await makeDag(panel);
    // c is queued and its only prerequisite (a) is done → ready
    expect(nodeById(el, 'c').querySelector('.dk-dag-box.elig')).not.toBeNull();
    // d is queued but depends on c (not done) → not ready
    expect(nodeById(el, 'd').querySelector('.dk-dag-box.elig')).toBeNull();
    el.remove();
  });

  it('dims nodes outside the hovered node lineage', async () => {
    const el = await makeDag(panel);
    nodeById(el, 'b').dispatchEvent(new MouseEvent('mouseenter'));
    await el.updateComplete;
    // b's lineage is a (up) and d (down); c is unrelated → dimmed
    expect(nodeById(el, 'c').classList.contains('dim')).toBe(true);
    expect(nodeById(el, 'a').classList.contains('dim')).toBe(false);
    expect(nodeById(el, 'd').classList.contains('dim')).toBe(false);
    el.remove();
  });

  it('routes a node click to onAction with the node id', async () => {
    const el = await makeDag(panel);
    let got: { action: string; payload: unknown } | null = null;
    el.onAction = (action, payload) => {
      got = { action, payload };
    };
    await el.updateComplete;
    nodeById(el, 'd').dispatchEvent(new MouseEvent('click'));
    expect(got).toEqual({ action: 'open', payload: { id: 'd' } });
    el.remove();
  });

  it('shows an empty-state message with no nodes', async () => {
    const el = await makeDag({ type: 'dag', nodes: [] });
    expect(el.textContent).toContain('no units to show');
    el.remove();
  });
});
