import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import type {
  BadgePanel,
  ChartPanel,
  HtmlPanel,
  KvPanel,
  LogPanel,
  Panel,
  ProgressPanel,
  ProsePanel,
  SectionPanel,
  StatPanel,
  TablePanel,
} from '../types';
import { chart } from './charts';
import { fmt } from './format';

const section = (p: SectionPanel): TemplateResult =>
  html`<div class="dk-panel dk-full dk-sec">${p.title ?? ''}</div>`;

const stat = (p: StatPanel): TemplateResult => html`
  <div class="dk-panel dk-stat">
    <div class="dk-l">${p.label ?? ''}</div>
    <div class="dk-n">${fmt(p.value)}${p.sub != null ? html` <small>${p.sub}</small>` : ''}</div>
  </div>`;

const progress = (p: ProgressPanel): TemplateResult => {
  const max = Number(p.max) || 0;
  const val = Number(p.value) || 0;
  const pct = p.pct != null ? Number(p.pct) : max ? (100 * val) / max : 0;
  const text =
    p.text != null ? p.text : max ? `${fmt(val)} / ${fmt(max)} · ${pct.toFixed(1)}%` : fmt(val);
  const width = `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`;
  return html`
    <div class="dk-panel dk-full">
      <div class="dk-l">${p.label ?? ''}</div>
      <div class="dk-bar"><i style="width:${width}"></i></div>
      <div class="dk-sub">${text}</div>
    </div>`;
};

const isNumCol = (align: string[], i: number): boolean => align[i] === 'right' || align[i] === 'num';

const table = (p: TablePanel): TemplateResult => {
  const cols = p.columns ?? [];
  const rows = p.rows ?? [];
  const al = p.align ?? [];
  return html`
    <div class="dk-panel dk-full">
      ${p.title ? html`<div class="dk-l">${p.title}</div>` : ''}
      <table class="dk-tbl">
        <thead>
          <tr>
            ${cols.map((c, i) => html`<th class=${isNumCol(al, i) ? 'num' : ''}>${c}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (r) => html`<tr>
              ${r.map(
                (v, i) =>
                  html`<td class=${isNumCol(al, i) ? 'num' : ''}>
                    ${typeof v === 'number' ? fmt(v) : v}
                  </td>`,
              )}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
};

const kv = (p: KvPanel): TemplateResult => html`
  <div class="dk-panel">
    ${p.title ? html`<div class="dk-l" style="margin-bottom:6px">${p.title}</div>` : ''}
    <div class="dk-kv">
      ${(p.items ?? []).map(
        (it) =>
          html`<div class="r">
            <b>${it.k}</b><span>${typeof it.v === 'number' ? fmt(it.v) : it.v}</span>
          </div>`,
      )}
    </div>
  </div>`;

const log = (p: LogPanel): TemplateResult => {
  const text = p.text != null ? p.text : (p.lines ?? []).join('\n');
  return html`
    <div class="dk-panel dk-full">
      ${p.title ? html`<div class="dk-l">${p.title}</div>` : ''}
      <pre class="dk-log">${text}</pre>
    </div>`;
};

const badge = (p: BadgePanel): TemplateResult =>
  html`<div class="dk-panel"><span class="dk-pill ${p.tone ?? ''}">${p.text ?? ''}</span></div>`;

const prose = (p: ProsePanel): TemplateResult => {
  const paras = String(p.text ?? '')
    .split(/\n\s*\n/)
    .filter((s) => s.trim());
  return html`
    <div class="dk-panel dk-full dk-prose">
      ${p.title ? html`<div class="dk-l">${p.title}</div>` : ''}${paras.map(
        (s) => html`<p>${s.trim()}</p>`,
      )}
    </div>`;
};

// First-party escape hatch: html is inserted UNescaped, matching the legacy atom. The spec
// is first-party (the daemon or a trusted kit), never user input.
const htmlAtom = (p: HtmlPanel): TemplateResult =>
  html`<div class="dk-panel dk-full">${unsafeHTML(p.html ?? '')}</div>`;

/** Render one panel. A throwing atom yields an error panel rather than blanking the view. */
export function panel(p: Panel): TemplateResult {
  try {
    switch (p.type) {
      case 'section':
        return section(p as SectionPanel);
      case 'stat':
        return stat(p as StatPanel);
      case 'progress':
        return progress(p as ProgressPanel);
      case 'chart':
        return chart(p as ChartPanel);
      case 'table':
        return table(p as TablePanel);
      case 'kv':
        return kv(p as KvPanel);
      case 'log':
        return log(p as LogPanel);
      case 'badge':
        return badge(p as BadgePanel);
      case 'prose':
        return prose(p as ProsePanel);
      case 'html':
        return htmlAtom(p as HtmlPanel);
      default:
        return html`<div class="dk-panel dk-full">
          <span class="dk-muted">unknown atom: ${p.type}</span>
        </div>`;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return html`<div class="dk-panel dk-full dk-err">atom error (${p.type}): ${msg}</div>`;
  }
}
