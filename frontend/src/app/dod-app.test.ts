import { describe, expect, it, vi } from 'vitest';

import { DodApi, type FetchLike } from './api';
import { DodApp } from './dod-app';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

function makeApp(api: DodApi): DodApp {
  const el = document.createElement('dod-app') as DodApp;
  el.api = api;
  document.body.appendChild(el);
  return el;
}

describe('dod-app', () => {
  it('refresh filters archived entries and renders the live count', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        entries: [
          { id: 'a', status: 'live', state: 'ready' },
          { id: 'z', state: 'archived' },
        ],
        discovered: [],
      }),
    );
    const app = makeApp(new DodApi('t', fetchMock as unknown as FetchLike));
    await app.refresh();
    await app.updateComplete;
    expect(app.querySelectorAll('dod-list .item').length).toBe(1);
    expect(app.querySelector('#count')?.textContent).toContain('1 live / 1');
    app.remove();
  });

  it('selecting from the list shows that entry in the detail', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ entries: [{ id: 'a', name: 'Aa', status: 'live', state: 'ready' }], discovered: [] }));
    const app = makeApp(new DodApi('t', fetchMock as unknown as FetchLike));
    await app.refresh();
    await app.updateComplete;
    app.querySelector('dod-list')?.dispatchEvent(new CustomEvent('select', { detail: 'a', bubbles: true }));
    await app.updateComplete;
    expect(app.querySelector('dod-detail')?.textContent).toContain('Aa');
    app.remove();
  });

  it('an action posts to the API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ entries: [{ id: 'a', status: 'live', state: 'ready', controllable: true, stop: 'sigterm' }], discovered: [] }),
      )
      .mockResolvedValue(jsonResponse({ ok: true }));
    const app = makeApp(new DodApi('t', fetchMock as unknown as FetchLike));
    await app.refresh();
    await app.updateComplete;
    app.querySelector('dod-list')?.dispatchEvent(new CustomEvent('action', { detail: { verb: 'stop', id: 'a' }, bubbles: true }));
    await flush();
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/api/stop'))).toBe(true);
    app.remove();
  });

  it('marks the entry pending the instant it is clicked, before the POST resolves', async () => {
    let releasePost!: (r: Response) => void;
    const heldPost = new Promise<Response>((res) => {
      releasePost = res;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ entries: [{ id: 'a', status: 'live', state: 'ready', controllable: true, stop: 'sigterm' }], discovered: [] }),
      )
      .mockImplementationOnce(() => heldPost) // the stop POST hangs (mirrors the real seconds-long stop)
      .mockResolvedValue(jsonResponse({ ok: true }));
    const app = makeApp(new DodApi('t', fetchMock as unknown as FetchLike));
    await app.refresh();
    await app.updateComplete;
    app.querySelector('dod-list')?.dispatchEvent(new CustomEvent('action', { detail: { verb: 'stop', id: 'a' }, bubbles: true }));
    const list = app.querySelector('dod-list') as HTMLElement & { updateComplete: Promise<unknown> };
    await app.updateComplete;
    await list.updateComplete;
    const btn = app.querySelector<HTMLButtonElement>('dod-list .btn.pending');
    expect(btn?.disabled).toBe(true);
    expect(btn?.textContent?.trim()).toBe('stopping…'); // reacts now, while the POST is still in flight
    releasePost(jsonResponse({ ok: true }));
    await flush();
    app.remove();
  });

  it('a rotated-token 403 triggers a reload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ entries: [{ id: 'a', status: 'live', state: 'ready', controllable: true, stop: 'sigterm' }], discovered: [] }),
      )
      .mockResolvedValue(jsonResponse({}, 403));
    const app = makeApp(new DodApi('t', fetchMock as unknown as FetchLike));
    app.reload = vi.fn();
    await app.refresh();
    await app.updateComplete;
    app.querySelector('dod-list')?.dispatchEvent(new CustomEvent('action', { detail: { verb: 'stop', id: 'a' }, bubbles: true }));
    await flush();
    expect(app.reload).toHaveBeenCalled();
    app.remove();
  });

  it('routes a spec-action to POST /api/action', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ entries: [{ id: 'c', status: 'live', state: 'ready', render: 'spec' }], discovered: [] }),
      )
      .mockResolvedValue(jsonResponse({ ok: true }));
    const app = makeApp(new DodApi('t', fetchMock as unknown as FetchLike));
    await app.refresh();
    await app.updateComplete;
    app
      .querySelector('dod-detail')
      ?.dispatchEvent(new CustomEvent('spec-action', { detail: { id: 'c', action: 'go', payload: { n: 1 } }, bubbles: true }));
    await flush();
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/api/action'))).toBe(true);
    app.remove();
  });
});

// A dropped poll, a board dod has not populated yet, and an entry that is genuinely gone all
// used to arrive as "the selected id is not in the list" and clear the selection — leaving the
// pane on "Select a project on the left" long after the dashboard came back. Only the last of
// the three is real news.
describe('dod-app selection survives a bad poll', () => {
  const LIVE = { id: 'a', name: 'Aa', status: 'live', state: 'ready' };

  /** An app with 'a' loaded and selected, and its fetch mock, ready for a second poll. */
  async function selected(second: unknown): Promise<[DodApp, ReturnType<typeof vi.fn>]> {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ entries: [LIVE], discovered: [] }))
      .mockImplementationOnce(() => (second instanceof Error ? Promise.reject(second) : Promise.resolve(second)));
    const app = makeApp(new DodApi('t', fetchMock as unknown as FetchLike));
    await app.refresh();
    await app.updateComplete;
    app.querySelector('dod-list')?.dispatchEvent(new CustomEvent('select', { detail: 'a', bubbles: true }));
    await app.updateComplete;
    expect(app.querySelector('dod-detail')?.textContent).toContain('Aa');
    return [app, fetchMock];
  }

  it('keeps the board and the selection when the poll fails outright', async () => {
    const [app] = await selected(new Error('daemon restarting'));
    await app.refresh();
    await app.updateComplete;
    expect(app.querySelectorAll('dod-list .item').length).toBe(1);
    expect(app.querySelector('dod-detail')?.textContent).toContain('Aa');
    app.remove();
  });

  it('keeps the selection when dod answers with an empty board', async () => {
    // dod restarted: it is serving, but its first sampler tick has not produced a snapshot.
    const [app] = await selected(jsonResponse({ entries: [], discovered: [] }));
    await app.refresh();
    await app.updateComplete;
    expect(app.querySelector('dod-detail')?.textContent).toContain('Aa');
    app.remove();
  });

  it('still clears the selection when a populated board no longer lists it', async () => {
    // The case that must keep working: the entry really is gone (archived, forgotten).
    const [app] = await selected(jsonResponse({ entries: [{ id: 'other', status: 'live', state: 'ready' }], discovered: [] }));
    await app.refresh();
    await app.updateComplete;
    expect(app.querySelector('dod-detail')?.textContent).toContain('Select a project');
    app.remove();
  });
});
