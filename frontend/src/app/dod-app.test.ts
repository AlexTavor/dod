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
