// Hand-rolled SVG charts, ported from the legacy dashkit.js to typed lit `svg` templates.
// Building the SVG via lit (rather than string concatenation) means every text binding is
// auto-escaped, so the old manual esc() calls are gone. Geometry is unchanged.

import { html, svg, type SVGTemplateResult, type TemplateResult } from 'lit';

import type { ChartMarker, ChartPanel, Series } from '../types';
import { color, fmtAxis, fmtX, trunc } from './format';

type Num = number | null;

/** A small inline sparkline. Needs >= 2 finite points or it renders an empty box. */
export function spark(vals: Num[], col: string): TemplateResult {
  const W = 240;
  const H = 46;
  const pad = 4;
  const n = vals.length;
  const good = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (good.length < 2) return html`<svg viewBox="0 0 ${W} ${H}"></svg>`;
  const lo = Math.min(...good);
  const hi = Math.max(...good);
  const span = hi - lo || 1;
  const x = (i: number): number => pad + (i / (n - 1)) * (W - 2 * pad);
  const y = (v: number): number => H - pad - ((v - lo) / span) * (H - 2 * pad);
  let d = '';
  let started = false;
  vals.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      started = false;
      return;
    }
    d += `${started ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
    started = true;
  });
  return html`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <path d=${d} fill="none" stroke=${col} stroke-width="1.6"></path>
  </svg>`;
}

const markerColor = (tone?: string): string =>
  tone === 'accent'
    ? 'var(--dk-accent)'
    : tone === 'err'
      ? 'var(--dk-err)'
      : tone === 'ok'
        ? 'var(--dk-ok)'
        : 'var(--dk-muted)';

/** Cartesian chart: line | area | bar | stacked, with optional time-axis markers. */
export function xyChart(
  kind: 'line' | 'area' | 'bar' | 'stacked',
  xlabels: Array<string | number>,
  series: Series[],
  markers?: ChartMarker[],
): TemplateResult {
  const W = 820;
  const H = 340;
  const m = { l: 60, r: 14, t: 22, b: 72 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const n = xlabels.length;
  const multi = series.length > 1;

  let max = 0;
  if (kind === 'stacked') {
    for (let i = 0; i < n; i++) {
      let s = 0;
      series.forEach((se) => {
        s += Math.max(0, Number(se.values[i]) || 0);
      });
      max = Math.max(max, s);
    }
  } else {
    series.forEach((se) => se.values.forEach((v) => { max = Math.max(max, Number(v) || 0); }));
  }
  max = max || 1;

  const ny = (v: number): number => m.t + ih - (v / max) * ih;
  const band = iw / Math.max(1, n);
  const bx = (i: number): number => m.l + band * i + band / 2;
  const parts: SVGTemplateResult[] = [];

  for (let t = 0; t <= 4; t++) {
    const v = (max * t) / 4;
    const y = ny(v);
    parts.push(svg`<line class="dk-grid" x1=${m.l} y1=${y} x2=${m.l + iw} y2=${y}></line>
      <text class="dk-tick" x=${m.l - 8} y=${y + 4} text-anchor="end">${fmtAxis(v)}</text>`);
  }

  const step = n > 18 ? Math.ceil(n / 18) : 1;
  for (let i = 0; i < n; i++) {
    if (i % step) continue;
    const x = bx(i);
    const yy = m.t + ih + 15;
    parts.push(
      svg`<text class="dk-tick" x=${x} y=${yy} text-anchor="end" transform=${`rotate(-35 ${x} ${yy})`}>${trunc(fmtX(xlabels[i]), 18)}</text>`,
    );
  }

  if (kind === 'bar' || kind === 'stacked') {
    const ns = series.length;
    if (kind === 'stacked') {
      for (let i = 0; i < n; i++) {
        let acc = 0;
        series.forEach((se, si) => {
          const v = Math.max(0, Number(se.values[i]) || 0);
          const y0 = ny(acc);
          const y1 = ny(acc + v);
          acc += v;
          const bw = band * 0.7;
          parts.push(
            svg`<rect x=${bx(i) - bw / 2} y=${y1} width=${bw} height=${Math.max(0, y0 - y1)} fill=${color(si)}></rect>`,
          );
        });
      }
    } else {
      const gw = band * 0.72;
      const sw = multi ? gw / ns : gw;
      for (let i = 0; i < n; i++) {
        series.forEach((se, si) => {
          const v = Math.max(0, Number(se.values[i]) || 0);
          const y = ny(v);
          const x = multi ? bx(i) - gw / 2 + si * sw : bx(i) - gw / 2;
          parts.push(
            svg`<rect x=${x} y=${y} width=${Math.max(1, sw - (multi ? 1.5 : 0))} height=${Math.max(0, m.t + ih - y)} fill=${color(multi ? si : 0)}></rect>`,
          );
        });
      }
    }
  } else {
    series.forEach((se, si) => {
      const pts = se.values.map((v, i) => `${bx(i)},${ny(Math.max(0, Number(v) || 0))}`).join(' ');
      if (kind === 'area' && !multi) {
        parts.push(
          svg`<polygon points=${`${bx(0)},${m.t + ih} ${pts} ${bx(n - 1)},${m.t + ih}`} fill=${color(0)} opacity=".18"></polygon>`,
        );
      }
      parts.push(svg`<polyline points=${pts} fill="none" stroke=${color(si)} stroke-width="2"></polyline>`);
      se.values.forEach((v, i) =>
        parts.push(svg`<circle cx=${bx(i)} cy=${ny(Math.max(0, Number(v) || 0))} r="2.6" fill=${color(si)}></circle>`),
      );
    });
  }

  parts.push(svg`<line class="dk-axis" x1=${m.l} y1=${m.t + ih} x2=${m.l + iw} y2=${m.t + ih}></line>
    <line class="dk-axis" x1=${m.l} y1=${m.t} x2=${m.l} y2=${m.t + ih}></line>`);

  (markers ?? []).forEach((mk) => {
    const idx = xlabels.indexOf(mk.x);
    if (idx < 0) return;
    const x = bx(idx);
    const col = markerColor(mk.tone);
    parts.push(
      svg`<line x1=${x} y1=${m.t} x2=${x} y2=${m.t + ih} stroke=${col} stroke-width="1" stroke-dasharray="3 3" opacity=".85"></line>`,
    );
    if (mk.label) {
      parts.push(svg`<text x=${x} y=${m.t - 6} text-anchor="middle" class="dk-tick" fill=${col}>${mk.label}</text>`);
    }
  });

  const legend = multi
    ? html`<div class="dk-legend">
        ${series.map((se, si) => html`<span><i style="background:${color(si)}"></i>${se.name ?? ''}</span>`)}
      </div>`
    : '';
  return html`<svg viewBox="0 0 ${W} ${H}">${parts}</svg>${legend}`;
}

/** Horizontal diverging bars in [-1, 1], e.g. a them/you lean per row. */
export function diverging(
  labels: Array<string | number>,
  values: Num[],
  leftLabel?: string,
  rightLabel?: string,
): TemplateResult {
  const rowH = 30;
  const m = { l: 140, r: 70, t: 8, b: 20 };
  const W = 820;
  const n = labels.length;
  const H = m.t + m.b + n * rowH;
  const iw = W - m.l - m.r;
  const cx = m.l + iw / 2;
  const half = iw / 2;
  const rows: SVGTemplateResult[] = [
    svg`<line class="dk-axis" x1=${cx} y1=${m.t} x2=${cx} y2=${m.t + n * rowH}></line>`,
  ];
  values.forEach((raw, i) => {
    const v = Math.max(-1, Math.min(1, Number(raw) || 0));
    const y = m.t + i * rowH;
    const w = Math.abs(v) * half;
    const x = v >= 0 ? cx : cx - w;
    const col = v >= 0 ? 'var(--dk-c1)' : 'var(--dk-c2)';
    rows.push(svg`<text class="dk-tick" x=${m.l - 10} y=${y + rowH / 2 + 4} text-anchor="end">${trunc(labels[i], 20)}</text>
      <rect x=${x} y=${y + 5} width=${Math.max(1, w)} height=${rowH - 12} rx="2" fill=${col}></rect>
      <text class="dk-cval" x=${v >= 0 ? cx + w + 6 : cx - w - 6} y=${y + rowH / 2 + 4} text-anchor=${v >= 0 ? 'start' : 'end'}>${v > 0 ? '+' : ''}${v.toFixed(2)}</text>`);
  });
  rows.push(svg`<text class="dk-tick" x=${m.l} y=${m.t + n * rowH + 14} text-anchor="start">← ${leftLabel ?? 'them'}</text>
    <text class="dk-tick" x=${m.l + iw} y=${m.t + n * rowH + 14} text-anchor="end">${rightLabel ?? 'you'} →</text>`);
  return html`<svg viewBox="0 0 ${W} ${H}">${rows}</svg>`;
}

/** Ranked horizontal bars. */
export function hbar(labels: Array<string | number>, values: Num[]): TemplateResult {
  const rowH = 22;
  const m = { l: 210, r: 64, t: 6, b: 6 };
  const W = 820;
  const n = labels.length;
  const H = m.t + m.b + n * rowH;
  const iw = W - m.l - m.r;
  const max = Math.max(...values.map((v) => Number(v) || 0), 0) || 1;
  const rows: SVGTemplateResult[] = [];
  values.forEach((v, i) => {
    const y = m.t + i * rowH;
    const w = Math.max(0, ((Number(v) || 0) / max) * iw);
    rows.push(svg`<text class="dk-tick" x=${m.l - 8} y=${y + rowH / 2 + 4} text-anchor="end">${trunc(fmtX(labels[i]), 30)}</text>
      <rect x=${m.l} y=${y + 3} width=${w} height=${rowH - 6} fill=${color(0)}></rect>
      <text class="dk-cval" x=${m.l + w + 6} y=${y + rowH / 2 + 4}>${fmtAxis(Number(v) || 0)}</text>`);
  });
  return html`<svg viewBox="0 0 ${W} ${H}">${rows}</svg>`;
}

/** The `chart` atom: pick a renderer by kind and wrap it in a panel. */
export function chart(p: ChartPanel): TemplateResult {
  const kind = p.kind ?? 'line';
  const series: Series[] = p.series ?? (p.values ? [{ name: p.label ?? '', values: p.values }] : []);
  const x: Array<string | number> = p.x ?? (series[0] ? series[0].values.map((_, i) => i) : []);
  const first = series[0]?.values ?? [];

  let body: TemplateResult;
  if (kind === 'spark') body = spark(first, color(p.color ?? 0));
  else if (kind === 'diverging') body = diverging(x, first, p.left, p.right);
  else if (kind === 'hbar') body = hbar(x, first);
  else if (kind === 'bars') body = xyChart('bar', x, series, p.markers);
  else if (kind === 'stacked') body = xyChart('stacked', x, series, p.markers);
  else if (kind === 'area') body = xyChart('area', x, series, p.markers);
  else body = xyChart('line', x, series, p.markers);

  const tile = kind === 'spark';
  return html`<div class="dk-panel dk-chart ${tile ? '' : 'dk-full'}">
    ${p.title ? html`<div class="dk-l">${p.title}</div>` : ''}${body}
  </div>`;
}
