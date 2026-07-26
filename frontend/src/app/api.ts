// A typed client for the dod control API. State-changing POSTs carry the per-boot token
// (the agent-control trust boundary). Injectable fetch keeps it unit-testable.

import type { ActionResult, ApiState, StateResult } from './types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class DodApi {
  constructor(
    private readonly token: string,
    private readonly doFetch: FetchLike = (input, init) => fetch(input, init),
  ) {}

  /**
   * GET /api/state. Never throws, so the poller cannot wedge — but it reports whether the
   * poll succeeded, because the caller has to tell "dod said nothing is registered" from
   * "dod did not answer". Both used to arrive as an empty list.
   */
  async state(): Promise<StateResult> {
    try {
      const r = await this.doFetch('/api/state');
      const data = (await r.json()) as Partial<ApiState>;
      return { ok: true, entries: data.entries ?? [], discovered: data.discovered ?? [] };
    } catch {
      return { ok: false, entries: [], discovered: [] };
    }
  }

  /**
   * POST /api/<action> with the token. A 403 means the token rotated (dod restarted): the
   * result carries error 'forbidden' so the caller can reload to pick up the fresh token.
   */
  async post(action: string, payload: Record<string, unknown> = {}): Promise<ActionResult> {
    const r = await this.doFetch(`/api/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dod-Token': this.token },
      body: JSON.stringify(payload),
    });
    if (r.status === 403) return { ok: false, error: 'forbidden', detail: 'token rotated' };
    try {
      return (await r.json()) as ActionResult;
    } catch {
      return {};
    }
  }
}
