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

const byId = (el: HTMLElement, id: string): SVGGElement =>
  el.querySelector<SVGGElement>(`g.dk-dag-node[data-id="${id}"]`)!;

const classesOf = (el: HTMLElement, cls: string): string[] =>
  Array.from(el.querySelectorAll<SVGGElement>(`g.dk-dag-node.${cls}`))
    .map((g) => g.getAttribute('data-id')!)
    .sort();

const typeQuery = async (el: DkDag, q: string): Promise<void> => {
  const input = el.querySelector<HTMLInputElement>('.dk-dag-q')!;
  input.value = q;
  input.dispatchEvent(new Event('input'));
  await el.updateComplete;
};

const pressDoc = async (el: DkDag, key: string): Promise<void> => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  await el.updateComplete;
};

const selectedId = (el: HTMLElement): string | undefined =>
  el.querySelector('.dk-dag-insp-id')?.textContent ?? undefined;

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

// A chain a → b → c, every unit matching "auth", plus an unrelated root. The chain puts the
// three hits at strictly increasing x, so stepping order is the axis order and not lane luck.
const findPanel: DagPanel = {
  type: 'dag',
  nodes: [
    { id: 'a', label: 'auth alpha', status: 'queued' },
    { id: 'b', label: 'auth beta', status: 'queued', dependsOn: ['a'] },
    { id: 'c', label: 'gamma', status: 'queued', dependsOn: ['b'], detail: { note: 'auth token' } },
    { id: 'z', label: 'zulu', status: 'queued' },
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

  it('keeps the ready ring and the critical outline on a search hit', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    // `a` is queued with no prerequisites, so it is both a hit and the actionable frontier.
    expect(byId(el, 'a').classList.contains('match')).toBe(true);
    expect(byId(el, 'a').querySelector('.dk-dag-box.elig')).not.toBeNull();
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

describe('dk-dag search', () => {
  // The no-op path: an idle search box must leave the graph exactly as it found it.
  it('dims nothing and marks nothing until something is typed', async () => {
    const el = await makeDag(findPanel);
    expect(el.querySelector('.dk-dag-q')).not.toBeNull();
    expect(classesOf(el, 'dim')).toEqual([]);
    expect(classesOf(el, 'match')).toEqual([]);
    expect(el.querySelector('.dk-dag-tally')?.textContent).toBe('');
    el.remove();
  });

  it('marks the hits, dims the rest, and tallies them', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    expect(classesOf(el, 'match')).toEqual(['a', 'b', 'c']);
    expect(classesOf(el, 'dim')).toEqual(['z']);
    expect(el.querySelector('.dk-dag-tally')?.textContent).toBe('3 hits');
    el.remove();
  });

  it('searches the detail the inspector would show, not just the label', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'token'); // only in c's note
    expect(classesOf(el, 'match')).toEqual(['c']);
    el.remove();
  });

  it('greys the whole graph and says so when nothing matches', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'nowhere');
    expect(classesOf(el, 'match')).toEqual([]);
    expect(classesOf(el, 'dim')).toEqual(['a', 'b', 'c', 'z']);
    expect(el.querySelector('.dk-dag-tally')?.textContent).toBe('no match');
    el.remove();
  });

  it('selects the first hit on Enter and steps forward on each one after', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    const input = el.querySelector<HTMLInputElement>('.dk-dag-q')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(selectedId(el)).toBe('a');
    expect(el.querySelector('.dk-dag-tally')?.textContent).toBe('1/3');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(selectedId(el)).toBe('b');
    el.remove();
  });

  it('steps with n and back with N, wrapping at both ends', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    await pressDoc(el, 'n');
    expect(selectedId(el)).toBe('a');
    await pressDoc(el, 'N'); // back past the start wraps to the last hit
    expect(selectedId(el)).toBe('c');
    expect(el.querySelector('.dk-dag-tally')?.textContent).toBe('3/3');
    await pressDoc(el, 'n'); // forward past the end wraps to the first
    expect(selectedId(el)).toBe('a');
    el.remove();
  });

  it('starts at the last hit when the first step is backwards', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    await pressDoc(el, 'N');
    expect(selectedId(el)).toBe('c');
    el.remove();
  });

  it('scrolls the hit it lands on to the centre of the graph box', async () => {
    const el = await makeDag(findPanel);
    const sc = el.querySelector<HTMLElement>('.dk-dag-scroll')!;
    const calls: Array<{ left: number; top: number }> = [];
    // jsdom has no scrollTo and no layout; the stub records what a browser would be asked for.
    sc.scrollTo = ((o: ScrollToOptions) => {
      calls.push({ left: o.left!, top: o.top! });
    }) as HTMLElement['scrollTo'];
    await typeQuery(el, 'auth');
    await pressDoc(el, 'N'); // the last hit, furthest along the axis

    // The expectation is read back off the rendered graph, so it pins "centres the unit you
    // landed on" rather than restating the layout's constants.
    const g = byId(el, 'c');
    const [, x, y] = /translate\(([\d.]+),([\d.]+)\)/.exec(g.getAttribute('transform')!)!;
    const box = g.querySelector('rect.dk-dag-box')!;
    expect(calls).toEqual([
      {
        left: Number(x) + Number(box.getAttribute('width')) / 2 - sc.clientWidth / 2,
        top: Number(y) + Number(box.getAttribute('height')) / 2 - sc.clientHeight / 2,
      },
    ]);
    el.remove();
  });

  it('does nothing on n while no search is up', async () => {
    const el = await makeDag(findPanel);
    await pressDoc(el, 'n');
    expect(el.querySelector('.dk-dag-insp.empty')).not.toBeNull();
    el.remove();
  });

  it('leaves n to the search box while you are typing in it', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    el.querySelector<HTMLInputElement>('.dk-dag-q')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'n', bubbles: true }),
    );
    await el.updateComplete;
    expect(el.querySelector('.dk-dag-insp.empty')).not.toBeNull(); // nothing was stepped onto
    el.remove();
  });

  it('clears the search on Escape, from the box and from the page', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    await pressDoc(el, 'Escape');
    expect(classesOf(el, 'match')).toEqual([]);
    expect(classesOf(el, 'dim')).toEqual([]);
    expect(el.querySelector<HTMLInputElement>('.dk-dag-q')!.value).toBe('');

    await typeQuery(el, 'auth');
    const input = el.querySelector<HTMLInputElement>('.dk-dag-q')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(classesOf(el, 'match')).toEqual([]);
    el.remove();
  });

  it('restarts the step count when the query changes', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    await pressDoc(el, 'n');
    await pressDoc(el, 'n');
    expect(el.querySelector('.dk-dag-tally')?.textContent).toBe('2/3');
    await typeQuery(el, 'auth alpha'); // a narrower query: its hit 1 is not the old hit 2
    expect(el.querySelector('.dk-dag-tally')?.textContent).toBe('1 hit');
    await pressDoc(el, 'n');
    expect(selectedId(el)).toBe('a');
    el.remove();
  });

  it('lets hover show a hit’s prerequisites, then returns to the search view', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'gamma'); // c only; a and b are dimmed
    expect(classesOf(el, 'dim')).toEqual(['a', 'b', 'z']);
    byId(el, 'c').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await el.updateComplete;
    // c's lineage is a and b (its prerequisites), which the search had greyed out
    expect(classesOf(el, 'dim')).toEqual(['z']);
    expect(classesOf(el, 'match')).toEqual(['c']); // the hit is still marked as one
    el.querySelector('.dk-dag-scroll')!.dispatchEvent(new MouseEvent('mouseleave'));
    await el.updateComplete;
    expect(classesOf(el, 'dim')).toEqual(['a', 'b', 'z']);
    el.remove();
  });

  it('keeps the query across a re-render, as a poll does', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    el.panel = { ...findPanel, nodes: [...findPanel.nodes!] }; // same plan, new poll
    await el.updateComplete;
    expect(classesOf(el, 'match')).toEqual(['a', 'b', 'c']);
    expect(el.querySelector<HTMLInputElement>('.dk-dag-q')!.value).toBe('auth');
    el.remove();
  });

  it('stops listening for step keys once the graph is gone', async () => {
    const el = await makeDag(findPanel);
    await typeQuery(el, 'auth');
    el.remove();
    // A detached element that still stepped would also still be selecting units nobody sees.
    // The await matters: a leaked listener steps synchronously but renders on Lit's next tick,
    // so asserting straight after the dispatch would pass with the listener still attached.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    await el.updateComplete;
    expect(el.querySelector('.dk-dag-insp:not(.empty)')).toBeNull();
  });
});
