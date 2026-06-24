import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { WordcloudFacet, WordcloudPanel } from '../types';
import { hbar } from './charts';
import { color } from './format';

const TONE: Record<string, string> = {
  warm: 'var(--dk-accent)',
  cool: 'var(--dk-c6)',
  you: 'var(--dk-c1)',
  them: 'var(--dk-c2)',
  ok: 'var(--dk-ok)',
  err: 'var(--dk-err)',
};

/**
 * The interactive `wordcloud` atom: pick a lens (facet) and a view (cloud or bars), all
 * client-side. Holds its own view/lens selection across render polls. Light DOM.
 */
@customElement('dk-wordcloud')
export class DkWordcloud extends LitElement {
  @property({ attribute: false }) panel: WordcloudPanel = { type: 'wordcloud' };
  @state() private view: 'cloud' | 'bars' = 'cloud';
  @state() private fkey: string | null = null;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  private facets(): WordcloudFacet[] {
    return (this.panel.facets ?? []).filter((f) => f.terms && f.terms.length);
  }

  private current(): WordcloudFacet | undefined {
    const fs = this.facets();
    return fs.find((f) => f.key === this.fkey) ?? fs[0];
  }

  private body(): TemplateResult {
    const f = this.current();
    if (!f?.terms?.length) return html`<div class="dk-muted">no terms for this lens</div>`;
    const legend =
      f.legend && f.legend.length
        ? html`<div class="dk-legend">
            ${f.legend.map((l) => html`<span><i style="background:${TONE[l.tone ?? ''] ?? color(0)}"></i>${l.label}</span>`)}
          </div>`
        : '';
    const terms = [...f.terms].sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
    if (this.view === 'bars') {
      const top = terms.slice(0, 22);
      return html`${legend}${hbar(
        top.map((t) => t.text),
        top.map((t) => Number(t.weight) || 0),
      )}`;
    }
    const ws = terms.map((t) => Number(t.weight) || 0);
    const max = Math.max(...ws, 1);
    const min = Math.min(...ws, 0);
    const span = max - min || 1;
    return html`${legend}<div class="dk-cloud">
      ${terms.slice(0, 70).map((t, i) => {
        const sz = 12 + Math.round(24 * Math.sqrt(((Number(t.weight) || 0) - min) / span));
        const col = t.tone && TONE[t.tone] ? TONE[t.tone] : color(t.group != null ? t.group : i);
        return html`<span style="font-size:${sz}px;color:${col}" title=${String(t.weight ?? '')}>${t.text}</span>`;
      })}
    </div>`;
  }

  private controls(): TemplateResult {
    const fs = this.facets();
    const cur = this.current();
    const lensTg =
      fs.length > 1
        ? html`<span class="dk-tg">
            ${fs.map(
              (f) => html`<button
                class="dk-tg-b ${f.key === cur?.key ? 'on' : ''}"
                @click=${() => {
                  this.fkey = f.key;
                }}
              >
                ${f.label ?? f.key}
              </button>`,
            )}
          </span>`
        : '';
    const viewTg = html`<span class="dk-tg">
      ${(['cloud', 'bars'] as const).map(
        (v) => html`<button
          class="dk-tg-b ${v === this.view ? 'on' : ''}"
          @click=${() => {
            this.view = v;
          }}
        >
          ${v}
        </button>`,
      )}
    </span>`;
    return html`<div class="dk-wc-ctl">${lensTg}${viewTg}</div>`;
  }

  render(): TemplateResult {
    const p = this.panel;
    const has = this.facets().length > 0;
    return html`<div class="dk-panel dk-full">
      ${p.title ? html`<div class="dk-l">${p.title}</div>` : ''}${has ? this.controls() : ''}
      <div class="dk-wc-body">${has ? this.body() : html`<div class="dk-muted">no terms available</div>`}</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dk-wordcloud': DkWordcloud;
  }
}
