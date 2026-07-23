import { html, LitElement, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { ActionHandler, DagNode, DagPanel } from '../types';
import { layoutDag, type PlacedEdge } from './dag-layout';
import { adjacency, bucketOf, frontier, lineage, type Bucket } from './dag-model';
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

/**
 * The `dag` atom: a dependency graph on an earliest-start axis. A node sits where it could
 * begin (the weighted length of the longest chain behind it), coloured by status; an edge runs
 * prerequisite → dependent. Units that can start now (not begun, every prerequisite done) get a
 * "ready" ring; the zero-float critical path is drawn in the redline colour; a float rail
 * trails each node that can slip. Hover highlights lineage. Holds only hover state across
 * render polls. Light DOM. Geometry comes from dag-layout, graph derivations from dag-model;
 * this element only places and paints.
 */
@customElement('dk-dag')
export class DkDag extends LitElement {
  @property({ attribute: false }) panel: DagPanel = { type: 'dag' };
  @property({ attribute: false }) onAction?: ActionHandler;
  @state() private hover: string | null = null;

  protected createRenderRoot(): HTMLElement {
    return this;
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
    const lit = this.hover ? lineage(this.hover, adj) : null;

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
      const cls = `dk-dag-node${dim ? ' dim' : ''}${act ? ' act' : ''}${pn.critical ? ' crit' : ''}`;
      const chars = Math.max(4, Math.floor((pn.w - 22) / 6.2));
      return svg`<g
        class=${cls}
        data-id=${pn.id}
        transform=${`translate(${pn.x},${pn.y})`}
        @click=${() => {
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
      ${title}${this.legend()}
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
    </div>`;
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
