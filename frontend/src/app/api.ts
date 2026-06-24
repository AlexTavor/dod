// A typed client for the dod control API. State-changing POSTs carry the per-boot token
// (the agent-control trust boundary). Injectable fetch keeps it unit-testable.

import type { ActionResult, ApiState } from './types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class DodApi {
  constructor(
    private readonly token: string,
    private readonly doFetch: FetchLike = (input, init) => fetch(input, init),
  ) {}

  /** GET /api/state. Returns empty lists on any failure so the poller never wedges. */
  async state(): Promise<ApiState> {
    try {
      const r = await this.doFetch('/api/state');
      const data = (await r.json()) as Partial<ApiState>;
      return { entries: data.entries ?? [], discovered: data.discovered ?? [] };
    } catch {
      return { entries: [], discovered: [] };
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
