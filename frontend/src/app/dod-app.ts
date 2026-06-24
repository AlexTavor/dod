import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import './dod-detail';
import './dod-list';
import { DodApi } from './api';
import { reorder } from './reorder';
import { isLive } from './status';
import type { State } from './types';

/**
 * The admin UI root: polls the dod API, holds the entry list + selection, and wires the
 * list and detail panes. Light DOM (shares the global app.css). The bootstrap sets `api`
 * and calls `start()`; tests set `api` and drive `refresh()` directly.
 */
@customElement('dod-app')
export class DodApp extends LitElement {
  api: DodApi = new DodApi('');
  /** Overridable so a rotated-token 403 is handled (and tested) without a real reload. */
  reload: () => void = () => location.reload();

  @state() private entries: State[] = [];
  @state() private selected: string | null = null;

  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  /** Begin the poll loop; called by the bootstrap once `api` is set. */
  start(intervalMs = 2000): void {
    this.stopped = false;
    const tick = async (): Promise<void> => {
      if (this.stopped) return;
      await this.refresh();
      this.timer = setTimeout(() => void tick(), intervalMs);
    };
    void tick();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  async refresh(): Promise<void> {
    const { entries } = await this.api.state();
    this.entries = entries.filter((e) => e.state !== 'archived');
    if (this.selected && !this.entries.some((e) => e.id === this.selected)) this.selected = null;
  }

  private async act(verb: string, id: string): Promise<void> {
    const res = await this.api.post(verb, { id });
    if (res.error === 'forbidden') {
      this.reload();
      return;
    }
    await this.refresh();
  }

  private async doReorder(from: string, to: string): Promise<void> {
    const order = reorder(
      this.entries.map((e) => e.id),
      from,
      to,
    );
    const rank = new Map(order.map((id, i) => [id, i]));
    this.entries = [...this.entries].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    await this.api.post('reorder', { order });
  }

  render(): TemplateResult {
    const live = this.entries.filter(isLive).length;
    const sel = this.entries.find((e) => e.id === this.selected) ?? null;
    return html`
      <header>
        <b>dod</b><span class="tagline">project control</span>
        <span class="spacer"></span>
        <span id="count" class="count">${live} live / ${this.entries.length}</span>
      </header>
      <dod-list
        .entries=${this.entries}
        .selected=${this.selected}
        @select=${(ev: CustomEvent<string>) => {
          this.selected = ev.detail;
        }}
        @action=${(ev: CustomEvent<{ verb: string; id: string }>) => void this.act(ev.detail.verb, ev.detail.id)}
        @reorder=${(ev: CustomEvent<{ from: string; to: string }>) => void this.doReorder(ev.detail.from, ev.detail.to)}
      ></dod-list>
      <dod-detail
        .entry=${sel}
        @action=${(ev: CustomEvent<{ verb: string; id: string }>) => void this.act(ev.detail.verb, ev.detail.id)}
      ></dod-detail>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dod-app': DodApp;
  }
}
