import { html, type TemplateResult } from 'lit';

import type { Panel, SectionPanel, StatPanel } from '../types';

/** Format a stat value the way the legacy renderer did (integers grouped, floats to 2dp). */
export function fmt(v: number | string | null | undefined): string {
  if (v == null) return '–';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '–';
    return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
  }
  return String(v);
}

const section = (p: SectionPanel): TemplateResult =>
  html`<div class="dk-panel dk-full dk-sec">${p.title ?? ''}</div>`;

const stat = (p: StatPanel): TemplateResult => html`
  <div class="dk-panel dk-stat">
    <div class="dk-l">${p.label ?? ''}</div>
    <div class="dk-n">${fmt(p.value)}${p.sub != null ? html` <small>${p.sub}</small>` : ''}</div>
  </div>`;

/** Render one panel. lit-html escapes all text bindings, so spec values can never inject HTML. */
export function panel(p: Panel): TemplateResult {
  switch (p.type) {
    case 'section':
      return section(p as SectionPanel);
    case 'stat':
      return stat(p as StatPanel);
    default:
      return html`<div class="dk-panel dk-full">
        <span class="dk-muted">unknown atom: ${p.type}</span>
      </div>`;
  }
}
