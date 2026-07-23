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
    // Hover is delegated to the scroll container (so it survives a re-render), so the event
    // must bubble from a node up to that container, as a real pointer move does.
    nodeById(el, 'b').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await el.updateComplete;
    // b's lineage is a (up) and d (down); c is unrelated → dimmed
    expect(nodeById(el, 'c').classList.contains('dim')).toBe(true);
    expect(nodeById(el, 'a').classList.contains('dim')).toBe(false);
    expect(nodeById(el, 'd').classList.contains('dim')).toBe(false);
    el.remove();
  });

  it('clears the highlight when the pointer leaves the graph', async () => {
    const el = await makeDag(panel);
    nodeById(el, 'b').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await el.updateComplete;
    el.querySelector('.dk-dag-scroll')!.dispatchEvent(new MouseEvent('mouseleave'));
    await el.updateComplete;
    expect(el.querySelectorAll('.dk-dag-node.dim').length).toBe(0);
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

  it('prompts for a selection until a node is clicked', async () => {
    const el = await makeDag(panel);
    expect(el.querySelector('.dk-dag-insp.empty')).not.toBeNull();
    expect(el.textContent).toContain('Select a unit');
    el.remove();
  });

  it('opens an inspector with the clicked unit’s detail, facts and note', async () => {
    const withDetail: DagPanel = {
      type: 'dag',
      nodes: [
        { id: 'a', label: 'Alpha', status: 'done' },
        {
          id: 'b',
          label: 'Beta',
          status: 'queued',
          dependsOn: ['a'],
          detail: {
            facts: [{ k: 'track', v: 'SIM' }],
            note: 'the brief',
            refs: [{ label: 'Phase M1 goal', text: 'byte-stable traces' }],
          },
        },
      ],
    };
    const el = await makeDag(withDetail);
    el.querySelector<SVGGElement>('g.dk-dag-node[data-id="b"]')!.dispatchEvent(
      new MouseEvent('click'),
    );
    await el.updateComplete;
    const insp = el.querySelector('.dk-dag-insp:not(.empty)')!;
    expect(insp).not.toBeNull();
    expect(insp.textContent).toContain('Beta');
    expect(insp.textContent).toContain('the brief');
    expect(insp.textContent).toContain('byte-stable traces'); // a source, zoomed in
    // waits-on is derived from the graph, not the detail payload
    expect(insp.querySelector('.dk-dag-chip')?.textContent).toBe('a');
    el.remove();
  });

  it('re-selects when a related-unit chip is clicked, so you can walk the graph', async () => {
    const el = await makeDag(panel);
    el.querySelector<SVGGElement>('g.dk-dag-node[data-id="d"]')!.dispatchEvent(
      new MouseEvent('click'),
    ); // d waits on b and c
    await el.updateComplete;
    (el.querySelector('.dk-dag-chip') as HTMLButtonElement).click(); // follow to a prerequisite
    await el.updateComplete;
    const id = el.querySelector('.dk-dag-insp-id')?.textContent;
    expect(['b', 'c']).toContain(id);
    el.remove();
  });
});
