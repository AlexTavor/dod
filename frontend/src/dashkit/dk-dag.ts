import { html, LitElement, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { ActionHandler, DagNode, DagPanel } from '../types';
import { layoutDag, type PlacedEdge } from './dag-layout';
import { adjacency, bucketOf, frontier, lineage, type Adjacency, type Bucket } from './dag-model';
import { matches, ordered } from './dag-search';
import { trunc } from './format';

// bucket → CSS variable, plus the legend rows. Presentation only: the status → bucket
// classification and the graph derivations live in dag-model. Data-by-key per CLAUDE.md.
const BUCKET_COLOR: Record<Bucket, string> = {
  idle: 'var(--dk-muted)',
  active: 'var(--dk-accent)',
  good: 'var(--dk-ok)',
  warn: 'var(--dk-warn)',
  err: 'var(--dk-err)',
};

const BUCKET_LEGEND: ReadonlyArray<readonly [Bucket, string]> = [
  ['idle', 'queued'],
  ['active', 'in progress'],
  ['good', 'done'],
  ['warn', 'blocked'],
  ['err', 'error'],
];

const colorOf = (status?: string): string => BUCKET_COLOR[bucketOf(status)];

/** A left-to-right cubic from the source face to the target face; the horizontal handles keep
 *  the curve flat where it leaves and enters a node, so parallel edges read as a bundle. */
function edgePath(e: PlacedEdge): string {
  const h = Math.max(24, Math.abs(e.x2 - e.x1) / 2);
  return `M${e.x1},${e.y1} C${e.x1 + h},${e.y1} ${e.x2 - h},${e.y2} ${e.x2},${e.y2}`;
}

/** Keys that step or clear the search from anywhere on the page, and what they do. The chord
 *  is spelled by `ev.key`, so an uppercase N already carries the shift. Data-by-key per
 *  CLAUDE.md. */
const FIND_KEYS: Record<string, 'next' | 'prev' | 'clear'> = {
  n: 'next',
  N: 'prev',
  Escape: 'clear',
};

/** The same shortcuts read back to the user, as the search box's tooltip. Nothing else on the
 *  panel announces them, so a key that moves here must be spelled out here too. */
const FIND_HINT = 'Enter or n: next match · Shift+Enter or N: previous · Esc: clear';

/** Whether a keystroke is being typed into a field, in which case it is that field's, never a
 *  shortcut. Covers our own search box, so `n` types an n while you are writing the query. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as Element | null;
  return !!el?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable=false])');
}

/**
 * The `dag` atom: a dependency graph on an earliest-start axis. A node sits where it could
 * begin (the weighted length of the longest chain behind it), coloured by status; an edge runs
 * prerequisite → dependent. Units that can start now (not begun, every prerequisite done) get a
 * "ready" ring; the zero-float critical path is drawn in the redline colour; a float rail
 * trails each node that can slip. Hover highlights lineage; clicking a node opens an inspector
 * with its full detail and its prerequisites/dependents as links you can follow. Free-text
 * search over the whole unit (label, status and everything the inspector would show) tints the
 * hits and greys the rest, and Enter / n / N step through them. Holds hover, selection and the
 * query across render polls. Light DOM. Geometry comes from dag-layout, graph derivations from
 * dag-model, the matching rule from dag-search; this element only places and paints.
 */
@customElement('dk-dag')
export class DkDag extends LitElement {
  @property({ attribute: false }) panel: DagPanel = { type: 'dag' };
  @property({ attribute: false }) onAction?: ActionHandler;
  @state() private hover: string | null = null;
  @state() private sel: string | null = null;
  @state() private q = '';
  /** Which hit is selected, as an index into `hits`; -1 until you step. */
  @state() private hitIx = -1;

  /** The last render's hits, in axis order, and where each node was drawn. Written by `render`
   *  and read by the key handlers, which fire outside a render and must not re-derive a layout
   *  to answer "what is the next hit" or "where is it". */
  private hits: string[] = [];
  private pos = new Map<string, { x: number; y: number; w: number; h: number }>();

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.onKey);
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.onKey);
    super.disconnectedCallback();
  }

  private nodes(): DagNode[] {
    return (this.panel.nodes ?? []).filter((n): n is DagNode => !!n && n.id != null);
  }

  private legend(): TemplateResult {
    return html`<div class="dk-legend dk-dag-legend">
      ${BUCKET_LEGEND.map(
        ([bucket, label]) => html`<span><i style="background:${BUCKET_COLOR[bucket]}"></i>${label}</span>`,
      )}
      <span><i class="dk-dag-elig-key"></i>ready now</span>
      <span><i class="dk-dag-crit-key"></i>critical path</span>
      <span><i class="dk-dag-float-key"></i>float</span>
    </div>`;
  }

  render(): TemplateResult {
    const nodes = this.nodes();
    const title = this.panel.title ? html`<div class="dk-l">${this.panel.title}</div>` : '';
    if (!nodes.length) {
      return html`<div class="dk-panel dk-full">${title}<div class="dk-muted">no units to show</div></div>`;
    }

    const layout = layoutDag(
      nodes.map((n) => ({ id: n.id, dependsOn: n.dependsOn, weight: n.weight })),
      this.panel.edges,
    );
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const adj = adjacency(
      nodes.map((n) => n.id),
      layout.edges,
    );
    const ready = frontier(nodes, adj.up);
    const hit = matches(nodes, this.q);
    this.hits = ordered(hit, layout.nodes);
    this.pos = new Map(layout.nodes.map((p) => [p.id, { x: p.x, y: p.y, w: p.w, h: p.h }]));

    // What stays bright. Hover wins while the pointer is on a node: reaching for a hit to ask
    // what it waits on must show the prerequisites, and those are usually not themselves hits.
    // The pointer leaves, the search view comes back. A searched-but-empty set lights nothing,
    // so "no match" reads as the whole graph greying rather than as no search at all.
    const lit = this.hover ? lineage(this.hover, adj) : this.q.trim() ? hit : null;
    // A selection from an earlier poll may name a unit the plan no longer has; drop it.
    const sel = this.sel && byId.has(this.sel) ? this.sel : null;

    // Float bars sit behind the nodes: a rail from a unit's right face to its latest finish,
    // so how far it can slip reads at a glance. Zero-float (critical) units have no bar.
    const floatParts: SVGTemplateResult[] = layout.nodes
      .filter((pn) => pn.floatEndX > pn.x + pn.w + 1)
      .map((pn) => {
        const dim = lit ? !lit.has(pn.id) : false;
        return svg`<rect
          class=${`dk-dag-float${dim ? ' dim' : ''}`}
          x=${pn.x + pn.w} y=${pn.y + pn.h / 2 - 3}
          width=${pn.floatEndX - (pn.x + pn.w)} height="6" rx="3"></rect>`;
      });

    const edgeParts: SVGTemplateResult[] = layout.edges.map((e) => {
      const on = lit ? lit.has(e.from) && lit.has(e.to) : false;
      const cls = `dk-dag-edge${on ? ' on' : ''}${e.back ? ' back' : ''}${e.critical ? ' crit' : ''}`;
      return svg`<path class=${cls} d=${edgePath(e)} marker-end="url(#dk-arrow)"></path>`;
    });

    const nodeParts: SVGTemplateResult[] = layout.nodes.map((pn) => {
      const n = byId.get(pn.id)!;
      const col = colorOf(n.status);
      const elig = ready.has(pn.id);
      const dim = lit ? !lit.has(pn.id) : false;
      const act = n.action;
      const on = sel === pn.id;
      // `match` tints the box FILL. Ready, critical and selected all speak through the stroke,
      // and a fourth stroke rule would have to outrank or yield to each of them; the fill is
      // free, so a hit stays visibly a hit while it is also ready, critical, hovered or picked.
      const cls = `dk-dag-node act${dim ? ' dim' : ''}${pn.critical ? ' crit' : ''}${
        on ? ' sel' : ''
      }${hit.has(pn.id) ? ' match' : ''}`;
      const chars = Math.max(4, Math.floor((pn.w - 22) / 6.2));
      return svg`<g
        class=${cls}
        data-id=${pn.id}
        transform=${`translate(${pn.x},${pn.y})`}
        @click=${() => {
          this.sel = pn.id;
          if (act) this.onAction?.(act, n.payload ?? { id: pn.id });
        }}
      >
        <rect class=${`dk-dag-box${elig ? ' elig' : ''}`} width=${pn.w} height=${pn.h} rx="8"></rect>
        <rect class="dk-dag-tone" x="0" y="0" width="4" height=${pn.h} rx="2" fill=${col}></rect>
        <circle cx=${pn.w - 12} cy="13" r="4" fill=${col}></circle>
        <text class="dk-dag-lbl" x="13" y="18">${trunc(n.label ?? pn.id, chars)}</text>
        <text class="dk-dag-sub" x="13" y="33">${trunc(n.sub ?? (elig ? 'ready' : n.status ?? ''), chars + 3)}</text>
      </g>`;
    });

    return html`<div class="dk-panel dk-full">
      <div class="dk-dag-head">${title}${this.finder()}</div>
      ${this.legend()}
      <div class="dk-dag-body">
        <div
          class="dk-dag-scroll"
          @mouseover=${(ev: MouseEvent) => this.onHover(ev)}
          @mouseleave=${() => {
            this.hover = null;
          }}
        >
          <svg
            class="dk-dag"
            width=${layout.width}
            height=${layout.height}
            viewBox="0 0 ${layout.width} ${layout.height}"
          >
            <defs>
              <marker id="dk-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                <path class="dk-dag-arrowhead" d="M0,0 L8,4 L0,8 z"></path>
              </marker>
            </defs>
            <g class="dk-dag-floats">${floatParts}</g>
            <g class="dk-dag-edges">${edgeParts}</g>
            <g class="dk-dag-nodes">${nodeParts}</g>
          </svg>
        </div>
        ${this.inspector(sel, byId, adj, ready)}
      </div>
    </div>`;
  }

  /** Which of the four search states you are in, in words. A query that matches nothing has
   *  nothing else to show for itself — the graph just greys — so saying so is the only thing
   *  that separates "searched, found none" from "the box ignored me". */
  private tally(): string {
    const n = this.hits.length;
    if (!this.q.trim()) return ''; // not searching
    if (!n) return 'no match';
    if (this.hitIx < 0) return `${n} hit${n === 1 ? '' : 's'}`; // found, not stepping yet
    return `${this.hitIx + 1}/${n}`; // on this one of them
  }

  /** The search box and its tally. */
  private finder(): TemplateResult {
    const none = !!this.q.trim() && !this.hits.length;
    return html`<div class="dk-dag-find">
      <input
        class="dk-dag-q"
        type="search"
        placeholder="search units"
        title=${FIND_HINT}
        .value=${this.q}
        @input=${(ev: Event) => this.query((ev.target as HTMLInputElement).value)}
        @keydown=${(ev: KeyboardEvent) => this.onFieldKey(ev)}
      />
      <span class="dk-dag-tally ${none ? 'none' : ''}">${this.tally()}</span>
    </div>`;
  }

  /** Adopt a new query. The step position resets: hit 3 of the old query is not hit 3 of this
   *  one, and carrying the index over would land the next `n` somewhere arbitrary. */
  private query(q: string): void {
    this.q = q;
    this.hitIx = -1;
  }

  /** Move `delta` hits and select where you land, wrapping at both ends. Selecting is the
   *  point: the inspector then shows the unit you stepped onto without a second click. */
  private step(delta: number): void {
    const n = this.hits.length;
    if (!n) return;
    // From "no position yet", forward starts at the first hit and backward at the last.
    const from = this.hitIx >= 0 ? this.hitIx : delta > 0 ? -1 : 0;
    this.hitIx = (((from + delta) % n) + n) % n;
    this.sel = this.hits[this.hitIx];
    this.reveal(this.sel);
  }

  /** Bring a node into the scroll box, centred. A step that selects a unit off-screen would
   *  otherwise look like nothing happened: the tally counts up and the graph sits still.
   *
   *  Instant, not `behavior: 'smooth'`. Smooth is decoration and it is not always delivered —
   *  a page whose tab or pane is not being painted runs no scroll animation, so the smooth
   *  version left the graph at scroll 0 while the tally read 13/13 and the unit it named was
   *  1400px off the right edge. Arriving is the requirement; gliding there is not. */
  private reveal(id: string): void {
    const box = this.pos.get(id);
    const sc = this.querySelector<HTMLElement>('.dk-dag-scroll');
    if (!box || !sc || typeof sc.scrollTo !== 'function') return;
    sc.scrollTo({
      left: box.x + box.w / 2 - sc.clientWidth / 2,
      top: box.y + box.h / 2 - sc.clientHeight / 2,
    });
  }

  /** Keys inside the search field: Enter steps forward, Shift+Enter back, Escape clears. The
   *  field keeps focus on Enter so you can keep stepping; Escape gives it up with the query. */
  private onFieldKey(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') this.step(ev.shiftKey ? -1 : 1);
    else if (ev.key === 'Escape') {
      this.query('');
      (ev.target as HTMLElement).blur();
    } else return;
    ev.preventDefault();
  }

  /** n / N / Escape from anywhere on the page, so you can step without going back to the box.
   *  Bound at the document because the graph itself takes no focus. Two guards keep it from
   *  stealing a keystroke: it does nothing unless a search is up (a bare `n` on a page with no
   *  query means nothing here), and never fires while the target is a field. */
  private readonly onKey = (ev: KeyboardEvent): void => {
    if (!this.q.trim() || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (isTyping(ev.target)) return;
    const act = FIND_KEYS[ev.key];
    if (!act) return;
    if (act === 'clear') this.query('');
    else this.step(act === 'next' ? 1 : -1);
    ev.preventDefault();
  };

  /** The detail pane for the selected node: an overview that reads top to bottom — status,
   *  the label/value facts, the brief, the references you can follow to a source, and the
   *  prerequisites and dependents as links that re-select. Null selection shows a hint. */
  private inspector(
    sel: string | null,
    byId: Map<string, DagNode>,
    adj: Adjacency,
    ready: Set<string>,
  ): TemplateResult {
    if (!sel) {
      return html`<aside class="dk-dag-insp empty">
        <div class="dk-dag-insp-hint">Select a unit to see its detail.</div>
      </aside>`;
    }
    const n = byId.get(sel)!;
    const d = n.detail ?? {};
    const chip = (id: string): TemplateResult => {
      const t = byId.get(id);
      return html`<button
        class="dk-dag-chip"
        title=${t?.label ?? id}
        @click=${() => {
          this.sel = id;
        }}
      >${id}</button>`;
    };
    const up = adj.up.get(sel) ?? [];
    const down = adj.down.get(sel) ?? [];
    const isReady = ready.has(sel);
    const state = isReady ? 'ready now' : (n.status ?? 'unknown');
    // The state chip takes the same colour the node's status dot uses, so the pane and the
    // graph agree; a ready-now unit borrows the ready ring's colour.
    const stateColor = isReady ? 'var(--dk-ready)' : colorOf(n.status);
    return html`<aside class="dk-dag-insp">
      <div class="dk-dag-insp-head">
        <span class="dk-dag-insp-id">${sel}</span>
        <button class="dk-dag-insp-x" title="Close" @click=${() => (this.sel = null)}>×</button>
      </div>
      <div class="dk-dag-insp-title">${n.label ?? sel}</div>
      <div class="dk-dag-insp-chips">
        <span class="dk-dag-state" style="color:${stateColor};border-color:${stateColor}">${state}</span>
      </div>
      ${d.facts && d.facts.length
        ? html`<dl class="dk-dag-facts">
            ${d.facts.map((f) => html`<div><dt>${f.k}</dt><dd>${f.v}</dd></div>`)}
          </dl>`
        : ''}
      ${d.note ? html`<p class="dk-dag-insp-note">${d.note}</p>` : ''}
      ${d.refs && d.refs.length
        ? html`<div class="dk-dag-insp-sec">
            <div class="dk-l">sources</div>
            ${d.refs.map(
              (r) => html`<div class="dk-dag-ref">
                ${r.href
                  ? html`<a href=${r.href} target="_blank" rel="noopener noreferrer">${r.label}</a>`
                  : html`<span class="dk-dag-ref-l">${r.label}</span>`}
                ${r.text ? html`<div class="dk-dag-ref-t">${r.text}</div>` : ''}
              </div>`,
            )}
          </div>`
        : ''}
      ${up.length
        ? html`<div class="dk-dag-insp-sec">
            <div class="dk-l">waits on</div>
            <div class="dk-dag-chips">${up.map(chip)}</div>
          </div>`
        : ''}
      ${down.length
        ? html`<div class="dk-dag-insp-sec">
            <div class="dk-l">unblocks</div>
            <div class="dk-dag-chips">${down.map(chip)}</div>
          </div>`
        : ''}
    </aside>`;
  }

  /** Hover is delegated to the scroll container, which survives a re-render, so the
   *  mouseleave that clears the highlight always fires even though `render` rebuilds every
   *  node group on each poll. Binding per-node would drop the leave and the highlight sticks. */
  private onHover(ev: MouseEvent): void {
    const g = (ev.target as Element | null)?.closest?.('g.dk-dag-node') as SVGGElement | null;
    const id = g?.getAttribute('data-id') ?? null;
    if (id !== this.hover) this.hover = id;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dk-dag': DkDag;
  }
}
