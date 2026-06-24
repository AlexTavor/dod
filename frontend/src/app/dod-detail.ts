import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { mount as dashkitMount } from '../dashkit/index';
import { canStart, canStop, isLive, statusWord } from './status';
import type { State } from './types';

interface MountHandle {
  stop: () => void;
}
type MountFn = (opts: { renderUrl: string; mount: HTMLElement }) => MountHandle;

/**
 * The right pane. Renders the selected entry's state (terminal / starting / crashed /
 * spec-render / iframe / can't-embed) and, for a live spec-render dashboard, mounts dashkit
 * into a host div. Light DOM. Emits `action` ({verb,id}).
 *
 * interact-down (routing dashkit actions back through dod) is wired in W4, once dashkit's
 * action mechanism is ported; for now spec dashboards render read-only.
 */
@customElement('dod-detail')
export class DodDetail extends LitElement {
  @property({ attribute: false }) entry: State | null = null;
  /** Injectable for tests; defaults to dashkit's mount. */
  mountSpec: MountFn = (opts) => dashkitMount(opts);

  private framed: string | null = null;
  private handle: MountHandle | null = null;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  private emit(verb: string, id: string): void {
    this.dispatchEvent(new CustomEvent('action', { detail: { verb, id }, bubbles: true, composed: true }));
  }

  private stopMount(): void {
    if (this.handle) {
      this.handle.stop();
      this.handle = null;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopMount();
  }

  // Lit's diffing keeps the #dkhost element across re-renders, so the mounted dashkit content
  // does not flicker. We only (re)mount when the rendered target actually changes.
  protected updated(): void {
    const e = this.entry;
    const key = e ? `${e.id}:${e.state ?? ''}:${e.render ?? ''}` : null;
    if (key === this.framed) return;
    this.framed = key;
    this.stopMount();
    if (e && isLive(e) && e.render === 'spec') {
      const host = this.querySelector<HTMLElement>('#dkhost');
      if (host) this.handle = this.mountSpec({ renderUrl: `/api/render?id=${encodeURIComponent(e.id)}`, mount: host });
    }
  }

  private head(e: State): TemplateResult {
    const s = statusWord(e);
    return html`<div class="dhead">
      <h2>${e.name ?? e.id}</h2>
      <span class="pill ${s.cls}">${s.word}</span>
      <span class="why">${e.blurb ?? ''}</span>
      <div class="acts">
        ${canStart(e) ? html`<button class="btn" @click=${() => this.emit('start', e.id)}>Start</button>` : ''}
        ${canStop(e) ? html`<button class="btn stop" @click=${() => this.emit('stop', e.id)}>Stop</button>` : ''}
        ${e.controllable ? html`<button class="btn" @click=${() => this.emit('restart', e.id)}>Restart</button>` : ''}
        ${e.port
          ? html`<a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank" rel="noreferrer">open ↗</a>`
          : ''}
      </div>
    </div>`;
  }

  private body(e: State): TemplateResult {
    if (e.type === 'terminal') {
      return html`<div class="pane">
        <h3>Terminal project</h3>
        <div>dod can launch it but cannot observe its window (accepted gap).</div>
      </div>`;
    }
    if (e.state === 'starting') {
      return html`<div class="pane"><div class="spin"></div>
        <h3>starting ${e.name ?? e.id}…</h3><pre>${e.log_tail ?? ''}</pre></div>`;
    }
    if (e.state === 'crashed' || e.state === 'unhealthy') {
      return html`<div class="pane">
        <h3 style="color:var(--err)">${statusWord(e).word}</h3>
        <pre>${e.log_tail ?? ''}</pre>
        <button class="btn" @click=${() => this.emit('restart', e.id)}>Restart</button>
      </div>`;
    }
    if (!isLive(e)) {
      return html`<div class="pane">
        <h3>${statusWord(e).word}</h3>
        <div>${e.why ?? ''}</div>
        ${canStart(e)
          ? html`<button class="btn" @click=${() => this.emit('start', e.id)}>Start</button>`
          : html`<div>Start it yourself; dod will adopt the port.</div>`}
      </div>`;
    }
    if (e.render === 'spec') return html`<div class="dk-host" id="dkhost"></div>`;
    if (e.embeddable) return html`<iframe id="frame" src="http://127.0.0.1:${e.port}/"></iframe>`;
    return html`<div class="pane">
      <h3>Can't embed ${e.name ?? e.id}</h3>
      <a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank" rel="noreferrer">open in new tab ↗</a>
    </div>`;
  }

  render(): TemplateResult {
    const e = this.entry;
    if (!e) return html`<div class="empty">Select a project on the left.</div>`;
    return html`${this.head(e)}<div class="body">${this.body(e)}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dod-detail': DodDetail;
  }
}
