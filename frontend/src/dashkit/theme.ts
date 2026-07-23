// dashkit's theme + atom styles, scoped under .dk-root so a host page's :root is never
// clobbered. Injected once via a <style id="dk-css"> tag, so the bundle stays a single
// self-contained file (the standalone shim loads only dashkit.js). Ported from the legacy
// dashkit.js. Interactive-atom styles (wordcloud, forms, actions) arrive with those atoms
// in W4.
const CSS = `
/* Two colour roles, kept apart on purpose. SEMANTIC tokens (accent/ok/warn/err/muted/ready)
   mean something: a status, a verdict. CATEGORICAL tokens (c1..c6) only separate one series
   from the next and carry no meaning. They used to be the same literals -- c1 was accent,
   c2 was ok, c3 was warn, c5 was err -- so a chart series was painted in the exact hex that
   means "blocked", and a status surface could pull a colour from the chart ramp. Semantic
   values are unchanged here; only the ramp and accent2 move. */
.dk-root{--dk-bg:#16140f;--dk-panel:#1f1b15;--dk-fg:#ece6d8;--dk-muted:#9a9384;--dk-line:#352f25;--dk-edge:#776d5c;
  --dk-accent:#d98a4f;--dk-accent2:#e8a765;--dk-ok:#6fa8a0;--dk-warn:#cda94e;--dk-err:#d4707a;--dk-ready:#7f9bd1;--dk-crit:#e35d44;
  --dk-c1:#8fbf7e;--dk-c2:#c495d8;--dk-c3:#d59bb4;--dk-c4:#6e8390;--dk-c5:#c9a97e;--dk-c6:#5fb9b2;
  color:var(--dk-fg);background:var(--dk-bg);font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;
  box-sizing:border-box;padding:18px 20px;display:block;min-height:100%}
.dk-root *{box-sizing:border-box}
html[data-theme=light] .dk-root,.dk-root[data-theme=light]{--dk-bg:#faf8f3;--dk-panel:#fff;--dk-fg:#1c1b19;
  --dk-muted:#7a756c;--dk-line:#e7e2d8;--dk-edge:#8b8478;--dk-accent:#b4541f;--dk-accent2:#c9762c;--dk-ok:#3f807a;
  --dk-warn:#9a7a18;--dk-err:#b1414f;--dk-ready:#41639b;--dk-crit:#b83227;--dk-c1:#4a7a3a;--dk-c2:#7a5bb0;--dk-c3:#a0507e;
  --dk-c4:#4a6670;--dk-c5:#8a6134;--dk-c6:#2f7f88}
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
.dk-acts{display:flex;flex-wrap:wrap;gap:6px}
.dk-btn{cursor:pointer;border:1px solid var(--dk-line);background:var(--dk-panel);color:var(--dk-fg);border-radius:6px;padding:5px 12px;font:inherit}
.dk-btn:hover{border-color:var(--dk-accent);color:var(--dk-accent)} .dk-btn[disabled]{opacity:.4;cursor:not-allowed}
.dk-wc-ctl{display:flex;gap:10px;margin:4px 0 10px;flex-wrap:wrap}
.dk-tg{display:inline-flex;border:1px solid var(--dk-line);border-radius:6px;overflow:hidden}
.dk-tg-b{border:0;border-right:1px solid var(--dk-line);background:var(--dk-panel);color:var(--dk-muted);font:inherit;font-size:12px;padding:3px 10px;cursor:pointer}
.dk-tg-b:last-child{border-right:0} .dk-tg-b.on{color:var(--dk-accent);background:var(--dk-bg)} .dk-tg-b:hover{color:var(--dk-fg)}
.dk-cloud{display:flex;flex-wrap:wrap;gap:4px 13px;align-items:baseline;padding:8px 2px;line-height:1.25}
.dk-cloud span{white-space:nowrap}
.dk-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:6px 0 10px}
.dk-f{display:flex;flex-direction:column;gap:3px;font-size:12px;min-width:0} .dk-f.dk-full{grid-column:1/-1}
.dk-fl{color:var(--dk-muted);font-size:11px}
.dk-f input,.dk-f select,.dk-f textarea{background:var(--dk-bg);border:1px solid var(--dk-line);border-radius:6px;color:var(--dk-fg);font:inherit;font-size:13px;padding:6px 8px;width:100%}
.dk-f textarea{min-height:84px;resize:vertical} .dk-fcheck{flex-direction:row;align-items:center;gap:7px}
/* stateful atoms wrap a dk-full panel; display:contents promotes that panel to the grid item so it spans the row */
dk-dag,dk-form,dk-wordcloud{display:contents}
.dk-dag-legend{margin:6px 0 0}
.dk-dag-elig-key{background:transparent!important;border:2px solid var(--dk-ready);border-radius:3px}
.dk-dag-crit-key{background:var(--dk-crit)!important}
.dk-dag-float-key{background:var(--dk-edge)!important;opacity:.4}
/* graph + inspector sit side by side, and wrap the inspector under the graph when the panel
   is too narrow to hold both. */
.dk-dag-body{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;align-items:flex-start}
.dk-dag-scroll{flex:1 1 440px;min-width:0;border:1px solid var(--dk-line);border-radius:9px;background:var(--dk-bg);overflow:auto;max-height:640px}
svg.dk-dag{display:block}
/* Float rail: how far a unit can slip before it moves the finish. Behind the nodes, quiet. */
.dk-dag-float{fill:var(--dk-edge);opacity:.28}
.dk-dag-float.dim{opacity:.08}
/* --dk-edge, not --dk-line: a dependency arrow is a graphical object carrying meaning and
   needs >=3:1 against the scroll box's --dk-bg, while --dk-line is a hairline border that
   should stay quiet. Sharing one token put every edge at ~1.4:1 dark / ~1.2:1 light. */
.dk-dag-edge{fill:none;stroke:var(--dk-edge);stroke-width:1.5}
.dk-dag-edge.back{stroke-dasharray:4 3}
/* The critical path (zero float): the chain that sets the finish. Drawn in the semantic
   critical colour, above the ordinary edges, so the spine of the plan reads at a glance. */
.dk-dag-edge.crit{stroke:var(--dk-crit);stroke-width:2.25}
.dk-dag-edge.on{stroke:var(--dk-accent);stroke-width:2}
.dk-dag-arrowhead{fill:var(--dk-edge)}
.dk-dag-node.crit .dk-dag-box{stroke:var(--dk-crit)}
.dk-dag-node{transition:opacity .15s ease}
.dk-dag-node.act{cursor:pointer}
.dk-dag-node.dim{opacity:.3}
.dk-dag-box{fill:var(--dk-panel);stroke:var(--dk-line);stroke-width:1}
.dk-dag-box.elig{stroke:var(--dk-ready);stroke-width:2}
.dk-dag-node:hover .dk-dag-box{stroke:var(--dk-accent)}
/* Hover must not eat the ready ring. The plain hover rule above is (0,3,0) and outranked the
   (0,2,0) .elig rule, so hovering a startable node to see what it depends on repainted its
   "ready now" ring as a generic hover ring -- the one signal you were reading vanished at the
   moment you reached for it. This (0,4,0) rule restores it while still marking hover. */
.dk-dag-node:hover .dk-dag-box.elig{stroke:var(--dk-ready);stroke-width:2.5}
.dk-dag-lbl{fill:var(--dk-fg);font-size:12px;font-weight:600}
.dk-dag-sub{fill:var(--dk-muted);font-size:11px;font-family:ui-monospace,monospace}
/* selected node: its own outline, set after the hover/crit rules so a click reads clearly.
   Hover (higher specificity) still wins while the pointer is on it, as transient feedback. */
.dk-dag-node.sel .dk-dag-box{stroke:var(--dk-accent2);stroke-width:3}
/* --- inspector --- */
.dk-dag-insp{flex:0 1 320px;min-width:240px;border:1px solid var(--dk-line);border-radius:9px;background:var(--dk-panel);padding:12px 14px;max-height:640px;overflow:auto;display:flex;flex-direction:column;gap:10px}
.dk-dag-insp.empty{align-items:center;justify-content:center;color:var(--dk-muted)}
.dk-dag-insp-hint{font-size:12px;color:var(--dk-muted);text-align:center;padding:18px 8px}
.dk-dag-insp-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.dk-dag-insp-id{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:var(--dk-muted);text-transform:uppercase}
.dk-dag-insp-x{border:0;background:none;color:var(--dk-muted);font-size:18px;line-height:1;cursor:pointer;padding:0 2px}
.dk-dag-insp-x:hover{color:var(--dk-fg)}
.dk-dag-insp-title{font-size:15px;font-weight:600;line-height:1.25}
.dk-dag-insp-chips{display:flex;flex-wrap:wrap;gap:6px}
.dk-dag-state{font-size:11px;padding:2px 9px;border-radius:20px;border:1px solid var(--dk-line);text-transform:lowercase}
.dk-dag-facts{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin:0;font-size:12px}
.dk-dag-facts>div{display:contents}
.dk-dag-facts dt{color:var(--dk-muted);text-transform:uppercase;font-size:10px;letter-spacing:.05em;align-self:center}
.dk-dag-facts dd{margin:0;color:var(--dk-fg)}
.dk-dag-insp-note{font-size:12.5px;line-height:1.55;color:var(--dk-fg);margin:0}
.dk-dag-insp-sec{display:flex;flex-direction:column;gap:5px;padding-top:9px;border-top:1px solid var(--dk-line)}
.dk-dag-ref{font-size:12px}
.dk-dag-ref a{color:var(--dk-accent);text-decoration:none}
.dk-dag-ref a:hover{text-decoration:underline}
.dk-dag-ref-l{color:var(--dk-fg);font-weight:600}
.dk-dag-ref-t{color:var(--dk-muted);line-height:1.5;margin-top:2px}
.dk-dag-chips{display:flex;flex-wrap:wrap;gap:5px}
.dk-dag-chip{font-family:ui-monospace,monospace;font-size:11px;padding:2px 8px;border:1px solid var(--dk-line);border-radius:5px;background:var(--dk-bg);color:var(--dk-fg);cursor:pointer}
.dk-dag-chip:hover{border-color:var(--dk-accent);color:var(--dk-accent)}
.dk-dag-insp .dk-l{font-size:10px;color:var(--dk-muted);text-transform:uppercase;letter-spacing:.06em}`;

/** Inject the theme once. Idempotent and safe to call on every render. */
export function injectCSS(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('dk-css')) return;
  const s = document.createElement('style');
  s.id = 'dk-css';
  s.textContent = CSS;
  (document.head ?? document.documentElement).appendChild(s);
}
