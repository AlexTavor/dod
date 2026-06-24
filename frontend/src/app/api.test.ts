import { describe, expect, it, vi } from 'vitest';

import { DodApi, type FetchLike } from './api';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('DodApi.state', () => {
  it('normalizes a full response and hits /api/state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ entries: [{ id: 'a' }], discovered: [{ id: 'd' }] }));
    const api = new DodApi('tok', fetchMock as unknown as FetchLike);
    const s = await api.state();
    expect(s.entries).toHaveLength(1);
    expect(s.discovered).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/state');
  });

  it('returns empty lists when the request throws', async () => {
    const api = new DodApi('tok', vi.fn().mockRejectedValue(new Error('down')) as unknown as FetchLike);
    expect(await api.state()).toEqual({ entries: [], discovered: [] });
  });

  it('fills missing keys with empty lists', async () => {
    const api = new DodApi('tok', vi.fn().mockResolvedValue(jsonResponse({})) as unknown as FetchLike);
    expect(await api.state()).toEqual({ entries: [], discovered: [] });
  });
});

describe('DodApi.post', () => {
  it('sends the token and a JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, id: 'a' }));
    const api = new DodApi('tok', fetchMock as unknown as FetchLike);
    const res = await api.post('start', { id: 'a' });
    expect(res).toEqual({ ok: true, id: 'a' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/start');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['X-Dod-Token']).toBe('tok');
    expect(JSON.parse(init.body as string)).toEqual({ id: 'a' });
  });

  it('reports a rotated token on 403 without throwing', async () => {
    const api = new DodApi('tok', vi.fn().mockResolvedValue(jsonResponse({}, 403)) as unknown as FetchLike);
    const res = await api.post('start', { id: 'a' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('forbidden');
  });
});
