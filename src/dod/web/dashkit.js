/* dashkit.js — ONE universal renderer for first-party localhost data dashboards.
 *
 * A dashboard's backend emits a flat spec {title, refresh_ms, panels:[{type, ...}]};
 * this file renders it. The SAME file renders a dashboard standalone (its own ~10-line
 * shim page) AND inside deck's center pane — one renderer, zero per-dashboard frontend.
 *
 * Atoms (~8 + an escape hatch): section · stat · progress · chart(spark|line|bars|hbar|
 * stacked) · table · kv · log · badge · html. Read-only (v1); interactive atoms are v2.
 * Zero-dep, theme-aware via CSS vars scoped under .dk-root (so it never clobbers a host's
 * own :root — e.g. deck's chrome). Charts are hand-rolled SVG; swap to uPlot UNDER the
 * atom only if one outgrows SVG — the spec never changes.
 *
 * API:  dashkit.mount({renderUrl, mount, refreshMs?}) -> {stop()}   // poll + render a live spec
 *       dashkit.renderSpec(spec, el)                                 // render one spec object
 */
(function () {
  if (window.dashkit) return;                       // idempotent: deck loads it once, shims once

  // ───────────────────────── theme + atom styles (scoped) ─────────────────────────
  const CSS = `
.dk-root{--dk-bg:#16140f;--dk-panel:#1f1b15;--dk-fg:#ece6d8;--dk-muted:#9a9384;--dk-line:#352f25;
  --dk-accent:#d98a4f;--dk-accent2:#cda94e;--dk-ok:#6fa8a0;--dk-warn:#cda94e;--dk-err:#d4707a;
  --dk-c1:#d98a4f;--dk-c2:#6fa8a0;--dk-c3:#cda94e;--dk-c4:#a98bd0;--dk-c5:#d4707a;--dk-c6:#7f9bd1;
  color:var(--dk-fg);background:var(--dk-bg);font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;
  box-sizing:border-box;padding:18px 20px;display:block;min-height:100%}
.dk-root *{box-sizing:border-box}
html[data-theme=light] .dk-root,.dk-root[data-theme=light]{--dk-bg:#faf8f3;--dk-panel:#fff;--dk-fg:#1c1b19;
  --dk-muted:#7a756c;--dk-line:#e7e2d8;--dk-accent:#b4541f;--dk-accent2:#9a7a18;--dk-ok:#3f807a;
  --dk-warn:#9a7a18;--dk-err:#b1414f;--dk-c1:#b4541f;--dk-c2:#3f807a;--dk-c3:#9a7a18;--dk-c4:#7a5bb0;
  --dk-c5:#b1414f;--dk-c6:#41639b}
.dk-title{font-size:16px;font-weight:600;letter-spacing:.02em;margin:0 0 12px}
.dk-panels{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;align-items:start}
.dk-panel{border:1px solid var(--dk-line);border-radius:10px;padding:11px 13px;background:var(--dk-panel);min-width:0}
.dk-full{grid-column:1/-1}
.dk-sec{border:0;background:none;padding:8px 2px 0;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--dk-muted)}
.dk-l{font-size:11px;color:var(--dk-muted);text-transform:uppercase;letter-spacing:.06em}
.dk-n{font-size:22px;font-family:ui-monospace,monospace;margin:1px 0 3px;line-height:1.1;word-break:break-word}
.dk-n small{font-size:12px;color:var(--dk-muted)}
.dk-sub{font-size:12px;color:var(--dk-muted);margin-top:3px}
.dk-muted{color:var(--dk-muted)} .dk-err{color:var(--dk-err)}
.dk-stat svg{width:100%;height:46px;display:block;margin-top:4px}
.dk-chart svg{width:100%;height:auto;display:block}
.dk-bar{height:14px;background:var(--dk-bg);border:1px solid var(--dk-line);border-radius:8px;overflow:hidden;margin:8px 0 4px}
.dk-bar>i{display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,var(--dk-accent2),var(--dk-accent));transition:width .6s ease}
.dk-pill{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;border:1px solid var(--dk-line);color:var(--dk-muted)}
.dk-pill.ok,.dk-pill.done{color:var(--dk-ok);border-color:var(--dk-ok)}
.dk-pill.run,.dk-pill.accent{color:var(--dk-accent);border-color:var(--dk-accent)}
.dk-pill.warn{color:var(--dk-warn);border-color:var(--dk-warn)} .dk-pill.err{color:var(--dk-err);border-color:var(--dk-err)}
.dk-kv{display:flex;flex-direction:column;gap:4px}
.dk-kv .r{display:flex;justify-content:space-between;gap:12px;font-size:13px}
.dk-kv .r span{color:var(--dk-muted);font-family:ui-monospace,monospace}
table.dk-tbl{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
.dk-tbl th,.dk-tbl td{padding:5px 12px 5px 0;text-align:left;border-bottom:1px solid var(--dk-line);white-space:nowrap}
.dk-tbl th{color:var(--dk-muted);font-weight:600;font-size:12px}
.dk-tbl td.num,.dk-tbl th.num{text-align:right;font-family:ui-monospace,monospace}
pre.dk-log{background:var(--dk-bg);border:1px solid var(--dk-line);border-radius:9px;padding:11px;overflow:auto;font-size:12px;color:var(--dk-muted);white-space:pre-wrap;margin:4px 0 0;max-height:260px}
.dk-prose{max-width:780px} .dk-prose p{margin:0 0 11px;line-height:1.62;color:var(--dk-fg);font-size:14px} .dk-prose p:last-child{margin-bottom:0}
.dk-chart .dk-l{margin-bottom:4px}
.dk-grid{stroke:var(--dk-line);stroke-width:1} .dk-axis{stroke:var(--dk-muted);stroke-width:1;opacity:.5}
.dk-tick{fill:var(--dk-muted);font-size:11px;font-family:ui-monospace,monospace}
.dk-cval{fill:var(--dk-fg);font-size:11px;font-family:ui-monospace,monospace}
.dk-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--dk-muted);margin-top:4px}
.dk-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:middle}
.dk-wc-ctl{display:flex;gap:10px;margin:4px 0 10px;flex-wrap:wrap}
.dk-tg{display:inline-flex;border:1px solid var(--dk-line);border-radius:6px;overflow:hidden}
.dk-tg-b{border:0;border-right:1px solid var(--dk-line);background:var(--dk-panel);color:var(--dk-muted);font:inherit;font-size:12px;padding:3px 10px;cursor:pointer}
.dk-tg-b:last-child{border-right:0} .dk-tg-b.on{color:var(--dk-accent);background:var(--dk-bg)} .dk-tg-b:hover{color:var(--dk-fg)}
.dk-cloud{display:flex;flex-wrap:wrap;gap:4px 13px;align-items:baseline;padding:8px 2px;line-height:1.25}
.dk-cloud span{white-space:nowrap}`;

  function injectCSS() {
    if (document.getElementById('dk-css')) return;
    const s = document.createElement('style');
    s.id = 'dk-css'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // ───────────────────────── helpers ─────────────────────────
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const COLORS = ['var(--dk-c1)', 'var(--dk-c2)', 'var(--dk-c3)', 'var(--dk-c4)', 'var(--dk-c5)', 'var(--dk-c6)'];
  const color = i => COLORS[(((+i || 0) % 6) + 6) % 6];
  function fmt(v) {
    if (v == null) return '–';
    if (typeof v === 'number') {
      if (!isFinite(v)) return '–';
      if (Number.isInteger(v)) return v.toLocaleString();
      return Math.abs(v) >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : v.toFixed(2);
    }
    return String(v);
  }
  function fmtAxis(v) {
    v = +v || 0; const a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  function fmtX(v) { if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10); return String(v); }
  function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // ───────────────────────── charts (hand-rolled SVG) ─────────────────────────
  function spark(vals, col) {
    const W = 240, H = 46, p = 4, n = vals.length;
    const good = vals.filter(v => v != null && isFinite(v));
    if (good.length < 2) return `<svg viewBox="0 0 ${W} ${H}"></svg>`;
    const lo = Math.min(...good), hi = Math.max(...good), span = (hi - lo) || 1;
    const X = i => p + (i / (n - 1)) * (W - 2 * p), Y = v => H - p - ((v - lo) / span) * (H - 2 * p);
    let d = '', started = false;
    vals.forEach((v, i) => { if (v == null || !isFinite(v)) { started = false; return; } d += (started ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1) + ' '; started = true; });
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${col}" stroke-width="1.6"/></svg>`;
  }

  function svgXY(kind, xlabels, series, markers) {
    const W = 820, H = 340, m = { l: 60, r: 14, t: 22, b: 72 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const n = xlabels.length, multi = series.length > 1;
    let max = 0;
    if (kind === 'stacked') { for (let i = 0; i < n; i++) { let s = 0; series.forEach(se => s += Math.max(0, +se.values[i] || 0)); max = Math.max(max, s); } }
    else series.forEach(se => se.values.forEach(v => max = Math.max(max, +v || 0)));
    max = max || 1;
    const ny = v => m.t + ih - (v / max) * ih, band = iw / Math.max(1, n), bx = i => m.l + band * i + band / 2;
    let g = '';
    for (let t = 0; t <= 4; t++) { const v = max * t / 4, y = ny(v); g += `<line class="dk-grid" x1="${m.l}" y1="${y}" x2="${m.l + iw}" y2="${y}"/><text class="dk-tick" x="${m.l - 8}" y="${y + 4}" text-anchor="end">${fmtAxis(v)}</text>`; }
    const step = n > 18 ? Math.ceil(n / 18) : 1;
    for (let i = 0; i < n; i++) { if (i % step) continue; const x = bx(i), yy = m.t + ih + 15; g += `<text class="dk-tick" x="${x}" y="${yy}" text-anchor="end" transform="rotate(-35 ${x} ${yy})">${esc(trunc(fmtX(xlabels[i]), 18))}</text>`; }
    if (kind === 'bar' || kind === 'stacked') {
      const ns = series.length;
      if (kind === 'stacked') {
        for (let i = 0; i < n; i++) { let acc = 0; series.forEach((se, si) => { const v = Math.max(0, +se.values[i] || 0), y0 = ny(acc), y1 = ny(acc + v); acc += v; const bw = band * 0.7, x = bx(i) - bw / 2; g += `<rect x="${x}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1)}" fill="${color(si)}"/>`; }); }
      } else { const gw = band * 0.72, sw = multi ? gw / ns : gw; for (let i = 0; i < n; i++) series.forEach((se, si) => { const v = Math.max(0, +se.values[i] || 0), y = ny(v), x = multi ? bx(i) - gw / 2 + si * sw : bx(i) - gw / 2; g += `<rect x="${x}" y="${y}" width="${Math.max(1, sw - (multi ? 1.5 : 0))}" height="${Math.max(0, (m.t + ih) - y)}" fill="${color(multi ? si : 0)}"/>`; }); }
    } else { // line / area
      series.forEach((se, si) => { const pts = se.values.map((v, i) => `${bx(i)},${ny(Math.max(0, +v || 0))}`).join(' '); if (kind === 'area' && !multi) g += `<polygon points="${bx(0)},${m.t + ih} ${pts} ${bx(n - 1)},${m.t + ih}" fill="${color(0)}" opacity=".18"/>`; g += `<polyline points="${pts}" fill="none" stroke="${color(si)}" stroke-width="2"/>`; se.values.forEach((v, i) => g += `<circle cx="${bx(i)}" cy="${ny(Math.max(0, +v || 0))}" r="2.6" fill="${color(si)}"/>`); });
    }
    g += `<line class="dk-axis" x1="${m.l}" y1="${m.t + ih}" x2="${m.l + iw}" y2="${m.t + ih}"/><line class="dk-axis" x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${m.t + ih}"/>`;
    (markers || []).forEach(mk => {           // turning-point / ending annotations on the time axis
      const idx = xlabels.indexOf(mk.x); if (idx < 0) return;
      const x = bx(idx), col = mk.tone === 'accent' ? 'var(--dk-accent)' : mk.tone === 'err' ? 'var(--dk-err)' : mk.tone === 'ok' ? 'var(--dk-ok)' : 'var(--dk-muted)';
      g += `<line x1="${x}" y1="${m.t}" x2="${x}" y2="${m.t + ih}" stroke="${col}" stroke-width="1" stroke-dasharray="3 3" opacity=".85"/>`;
      if (mk.label) g += `<text x="${x}" y="${m.t - 6}" text-anchor="middle" class="dk-tick" fill="${col}">${esc(mk.label)}</text>`;
    });
    const legend = multi ? '<div class="dk-legend">' + series.map((se, si) => `<span><i style="background:${color(si)}"></i>${esc(se.name)}</span>`).join('') + '</div>' : '';
    return `<svg viewBox="0 0 ${W} ${H}">${g}</svg>${legend}`;
  }

  function svgDiverging(labels, values, leftLabel, rightLabel) {
    const rowH = 30, m = { l: 140, r: 70, t: 8, b: 20 }, W = 820, n = labels.length;
    const H = m.t + m.b + n * rowH, iw = W - m.l - m.r, cx = m.l + iw / 2, half = iw / 2;
    let g = `<line class="dk-axis" x1="${cx}" y1="${m.t}" x2="${cx}" y2="${m.t + n * rowH}"/>`;
    values.forEach((raw, i) => {
      const v = Math.max(-1, Math.min(1, +raw || 0)), y = m.t + i * rowH, w = Math.abs(v) * half;
      const x = v >= 0 ? cx : cx - w, col = v >= 0 ? 'var(--dk-c1)' : 'var(--dk-c2)';
      g += `<text class="dk-tick" x="${m.l - 10}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(trunc(labels[i], 20))}</text>`;
      g += `<rect x="${x}" y="${y + 5}" width="${Math.max(1, w)}" height="${rowH - 12}" rx="2" fill="${col}"/>`;
      g += `<text class="dk-cval" x="${v >= 0 ? cx + w + 6 : cx - w - 6}" y="${y + rowH / 2 + 4}" text-anchor="${v >= 0 ? 'start' : 'end'}">${v > 0 ? '+' : ''}${v.toFixed(2)}</text>`;
    });
    g += `<text class="dk-tick" x="${m.l}" y="${m.t + n * rowH + 14}" text-anchor="start">← ${esc(leftLabel || 'them')}</text>`;
    g += `<text class="dk-tick" x="${m.l + iw}" y="${m.t + n * rowH + 14}" text-anchor="end">${esc(rightLabel || 'you')} →</text>`;
    return `<svg viewBox="0 0 ${W} ${H}">${g}</svg>`;
  }

  function svgHBar(labels, values) {
    const rowH = 22, m = { l: 210, r: 64, t: 6, b: 6 }, W = 820, n = labels.length, H = m.t + m.b + n * rowH, iw = W - m.l - m.r;
    const max = Math.max(...values.map(v => +v || 0), 0) || 1; let g = '';
    values.forEach((v, i) => { const y = m.t + i * rowH, w = Math.max(0, (+v || 0) / max * iw); g += `<text class="dk-tick" x="${m.l - 8}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(trunc(fmtX(labels[i]), 30))}</text><rect x="${m.l}" y="${y + 3}" width="${w}" height="${rowH - 6}" fill="${color(0)}"/><text class="dk-cval" x="${m.l + w + 6}" y="${y + rowH / 2 + 4}">${fmtAxis(v)}</text>`; });
    return `<svg viewBox="0 0 ${W} ${H}">${g}</svg>`;
  }

  // ───────────────────────── wordcloud (interactive: facet + cloud/bars, all client-side) ──
  const wcState = {};   // id → {facets, view, fkey}; persists across poll re-renders (no server mutation)
  const TONE = { warm: 'var(--dk-accent)', cool: 'var(--dk-c6)', you: 'var(--dk-c1)', them: 'var(--dk-c2)', ok: 'var(--dk-ok)', err: 'var(--dk-err)' };

  function wcBody(st) {
    const f = (st.facets || []).find(x => x.key === st.fkey) || (st.facets || [])[0];
    if (!f || !f.terms || !f.terms.length) return '<div class="dk-muted">no terms for this lens</div>';
    const lg = (f.legend && f.legend.length) ? '<div class="dk-legend">' + f.legend.map(l => `<span><i style="background:${TONE[l.tone] || color(0)}"></i>${esc(l.label)}</span>`).join('') + '</div>' : '';
    const terms = f.terms.slice().sort((a, b) => (+b.weight || 0) - (+a.weight || 0));
    if (st.view === 'bars') {
      const top = terms.slice(0, 22);
      return lg + svgHBar(top.map(t => t.text), top.map(t => +t.weight || 0));
    }
    const ws = terms.map(t => +t.weight || 0), max = Math.max(...ws, 1), min = Math.min(...ws, 0), span = (max - min) || 1;
    return lg + '<div class="dk-cloud">' + terms.slice(0, 70).map((t, i) => {
      const sz = 12 + Math.round(24 * Math.sqrt(((+t.weight || 0) - min) / span));
      const col = (t.tone && TONE[t.tone]) ? TONE[t.tone] : color(t.group != null ? t.group : i);
      return `<span style="font-size:${sz}px;color:${col}" title="${esc(t.weight)}">${esc(t.text)}</span>`;
    }).join(' ') + '</div>';
  }
  function wcControls(id, st) {
    const facets = st.facets || [];
    const fb = facets.length > 1 ? '<span class="dk-tg">' + facets.map(f => `<button class="dk-tg-b${f.key === st.fkey ? ' on' : ''}" onclick="dashkit._wc('${esc(id)}','fkey','${esc(f.key)}')">${esc(f.label || f.key)}</button>`).join('') + '</span>' : '';
    const vb = '<span class="dk-tg">' + ['cloud', 'bars'].map(v => `<button class="dk-tg-b${v === st.view ? ' on' : ''}" onclick="dashkit._wc('${esc(id)}','view','${v}')">${v}</button>`).join('') + '</span>';
    return `<div class="dk-wc-ctl">${fb}${vb}</div>`;
  }
  function wordcloudPanel(p) {
    const id = p.id || ('wc-' + String(p.title || 'words').replace(/\W+/g, '-'));
    const facets = (p.facets || []).filter(f => f && f.terms && f.terms.length);
    const st = wcState[id] || (wcState[id] = {});
    st.facets = facets;
    if (!st.view) st.view = 'cloud';
    if (!st.fkey || !facets.some(f => f.key === st.fkey)) st.fkey = facets[0] ? facets[0].key : null;
    const body = facets.length ? wcBody(st) : '<div class="dk-muted">no terms available</div>';
    return `<div class="dk-panel dk-full" data-wcid="${esc(id)}">${p.title ? `<div class="dk-l">${esc(p.title)}</div>` : ''}${facets.length ? wcControls(id, st) : ''}<div class="dk-wc-body">${body}</div></div>`;
  }
  function _wc(id, k, v) {                 // control handler — re-renders just this atom's subtree
    const st = wcState[id]; if (!st) return;
    st[k] = v;
    let root; try { root = document.querySelector(`[data-wcid="${CSS.escape(id)}"]`); } catch (e) { return; }
    if (!root) return;
    const body = root.querySelector('.dk-wc-body'); if (body) body.innerHTML = wcBody(st);
    const ctl = root.querySelector('.dk-wc-ctl'); if (ctl) ctl.outerHTML = wcControls(id, st);
  }

  // ───────────────────────── atoms ─────────────────────────
  function statPanel(p) {
    const sp = (p.spark && p.spark.length) ? spark(p.spark, color(p.color != null ? p.color : 0)) : '';
    const sub = p.sub != null ? ` <small>${esc(p.sub)}</small>` : '';
    return `<div class="dk-panel dk-stat"><div class="dk-l">${esc(p.label || '')}</div><div class="dk-n">${esc(fmt(p.value))}${sub}</div>${sp}</div>`;
  }
  function progressPanel(p) {
    const max = +p.max || 0, val = +p.value || 0;
    const pct = p.pct != null ? +p.pct : (max ? 100 * val / max : 0);
    const text = p.text != null ? p.text : (max ? `${fmt(val)} / ${fmt(max)} · ${pct.toFixed(1)}%` : fmt(val));
    return `<div class="dk-panel dk-full"><div class="dk-l">${esc(p.label || '')}</div><div class="dk-bar"><i style="width:${Math.max(0, Math.min(100, pct)).toFixed(1)}%"></i></div><div class="dk-sub">${esc(text)}</div></div>`;
  }
  function chartPanel(p) {
    const kind = p.kind || 'line';
    let series = p.series || (p.values ? [{ name: p.label || '', values: p.values }] : []);
    if (!Array.isArray(series)) series = [];
    const x = p.x || (series[0] ? series[0].values.map((_, i) => i) : []);
    const mk = p.markers;
    let svg;
    if (kind === 'spark') svg = spark((series[0] || {}).values || [], color(p.color != null ? p.color : 0));
    else if (kind === 'diverging') svg = svgDiverging(x, (series[0] || {}).values || [], p.left, p.right);
    else if (kind === 'hbar') svg = svgHBar(x, (series[0] || {}).values || []);
    else if (kind === 'bars') svg = svgXY('bar', x, series, mk);
    else if (kind === 'stacked') svg = svgXY('stacked', x, series, mk);
    else if (kind === 'area') svg = svgXY('area', x, series, mk);
    else svg = svgXY('line', x, series, mk);
    const tile = (kind === 'spark');                 // sparks are small tiles; real charts span the row
    return `<div class="dk-panel dk-chart${tile ? '' : ' dk-full'}">${p.title ? `<div class="dk-l">${esc(p.title)}</div>` : ''}${svg}</div>`;
  }
  function tablePanel(p) {
    const cols = p.columns || [], rows = p.rows || [], al = p.align || [];
    const num = i => al[i] === 'right' || al[i] === 'num';
    return `<div class="dk-panel dk-full">${p.title ? `<div class="dk-l">${esc(p.title)}</div>` : ''}<table class="dk-tbl"><thead><tr>${cols.map((c, i) => `<th class="${num(i) ? 'num' : ''}">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td class="${num(i) ? 'num' : ''}">${esc(typeof v === 'number' ? fmt(v) : v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function kvPanel(p) {
    const items = p.items || [];
    return `<div class="dk-panel">${p.title ? `<div class="dk-l" style="margin-bottom:6px">${esc(p.title)}</div>` : ''}<div class="dk-kv">${items.map(it => `<div class="r"><b>${esc(it.k)}</b><span>${esc(typeof it.v === 'number' ? fmt(it.v) : it.v)}</span></div>`).join('')}</div></div>`;
  }
  function logPanel(p) {
    const text = p.text != null ? p.text : (p.lines || []).join('\n');
    return `<div class="dk-panel dk-full">${p.title ? `<div class="dk-l">${esc(p.title)}</div>` : ''}<pre class="dk-log">${esc(text)}</pre></div>`;
  }
  function panel(p) {
    try {
      switch (p && p.type) {
        case 'section': return `<div class="dk-panel dk-full dk-sec">${esc(p.title || '')}</div>`;
        case 'stat': return statPanel(p);
        case 'progress': return progressPanel(p);
        case 'chart': return chartPanel(p);
        case 'wordcloud': return wordcloudPanel(p);
        case 'table': return tablePanel(p);
        case 'kv': return kvPanel(p);
        case 'log': return logPanel(p);
        case 'badge': return `<div class="dk-panel"><span class="dk-pill ${esc(p.tone || '')}">${esc(p.text || '')}</span></div>`;
        case 'prose': return `<div class="dk-panel dk-full dk-prose">${p.title ? `<div class="dk-l">${esc(p.title)}</div>` : ''}${String(p.text || '').split(/\n\s*\n/).filter(s => s.trim()).map(s => `<p>${esc(s.trim())}</p>`).join('')}</div>`;
        case 'html': return `<div class="dk-panel dk-full">${p.html || ''}</div>`;   // first-party escape hatch (NOT escaped)
        default: return `<div class="dk-panel dk-full"><span class="dk-muted">unknown atom: ${esc(p && p.type)}</span></div>`;
      }
    } catch (e) { return `<div class="dk-panel dk-full dk-err">atom error (${esc(p && p.type)}): ${esc(e.message)}</div>`; }
  }

  // ───────────────────────── render + poll ─────────────────────────
  function renderSpec(spec, el) {
    injectCSS();
    el.classList.add('dk-root');
    const panels = (spec && spec.panels) || [];
    el.innerHTML = `${spec && spec.title ? `<div class="dk-title">${esc(spec.title)}</div>` : ''}<div class="dk-panels">${panels.map(panel).join('')}</div>`;
  }

  function mount(opts) {
    injectCSS();
    const el = (typeof opts.mount === 'string' ? document.querySelector(opts.mount) : opts.mount) || document.body;
    let stopped = false, timer = null;
    async function tick() {
      if (stopped) return;
      try {
        const spec = await (await fetch(opts.renderUrl, { cache: 'no-store' })).json();
        if (stopped) return;
        renderSpec(spec, el);
        timer = setTimeout(tick, opts.refreshMs || spec.refresh_ms || 3000);
      } catch (e) {
        if (!el.firstChild) { injectCSS(); el.classList.add('dk-root'); el.innerHTML = `<div class="dk-panel dk-full dk-err">dashkit: cannot reach ${esc(opts.renderUrl)}</div>`; }
        timer = setTimeout(tick, opts.refreshMs || 3000);
      }
    }
    tick();
    return { stop() { stopped = true; if (timer) clearTimeout(timer); } };
  }

  window.dashkit = { mount, renderSpec, version: '1', _wc };
})();
