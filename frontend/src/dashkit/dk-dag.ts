import { html, LitElement, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { ActionHandler, DagNode, DagPanel } from '../types';
import { layoutDag, type PlacedEdge } from './dag-layout';
import { trunc } from './format';

// status word → a tone bucket, then tone → colour. Both carve UnitState (queued/planning/
// in-cycle/green/blocked/needs-HITL/landed/done) and the remediation state (pending/
// in-progress/green/needs-hitl/committed/error) fold into five tones. Data-by-key per
// CLAUDE.md: a lookup table with an explicit fallback, never an if/elif chain.
const STATUS_TONE: Record<string, string> = {
  queued: 'idle',
  pending: 'idle',
  planning: 'active',
  'in-cycle': 'active',
  'in-progress': 'active',
  green: 'good',
  landed: 'good',
  committed: 'good',
  done: 'good',
  blocked: 'warn',
  'needs-hitl': 'warn',
  error: 'err',
};

const TONE_COLOR: Record<string, string> = {
  idle: 'var(--dk-muted)',
  active: 'var(--dk-accent)',
  good: 'var(--dk-ok)',
  warn: 'var(--dk-warn)',
  err: 'var(--dk-err)',
};

// legend order + the representative word shown for each tone
const TONE_LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['idle', 'queued'],
  ['active', 'in progress'],
  ['good', 'done'],
  ['warn', 'blocked'],
  ['err', 'error'],
];

const toneOf = (status?: string): string => STATUS_TONE[(status ?? '').toLowerCase()] ?? 'idle';
const colorOf = (tone: string): string => TONE_COLOR[tone] ?? TONE_COLOR.idle;

/**
 * The `dag` atom: a layered fix-dependency graph. Each node is a remediation unit coloured by
 * status; an edge runs prerequisite → dependent. Units that can be started now (not begun,
 * every prerequisite done) get a "ready" ring. Hover a node to light up its lineage. Holds
 * only hover state across render polls. Light DOM.
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

  /** Walk an adjacency map from `start`, returning every reachable id (excludes `start`). */
  private reach(start: string, adj: Map<string, string[]>): Set<string> {
    const seen = new Set<string>();
    const stack = [start];
    while (stack.length) {
      const u = stack.pop()!;
      for (const v of adj.get(u) ?? [])
        if (!seen.has(v)) {
          seen.add(v);
          stack.push(v);
        }
    }
    return seen;
  }

  private legend(): TemplateResult {
    return html`<div class="dk-legend dk-dag-legend">
      ${TONE_LEGEND.map(
        ([tone, label]) => html`<span><i style="background:${colorOf(tone)}"></i>${label}</span>`,
      )}
      <span><i class="dk-dag-elig-key"></i>ready now</span>
    </div>`;
  }

  render(): TemplateResult {
    const nodes = this.nodes();
    const title = this.panel.title ? html`<div class="dk-l">${this.panel.title}</div>` : '';
    if (!nodes.length) {
      return html`<div class="dk-panel dk-full">${title}<div class="dk-muted">no units to show</div></div>`;
    }

    const layout = layoutDag(
      nodes.map((n) => ({ id: n.id, dependsOn: n.dependsOn })),
      this.panel.edges,
    );
    const byId = new Map(nodes.map((n) => [n.id, n]));

    // adjacency from the placed edges: prerequisites (up) and dependents (down)
    const up = new Map<string, string[]>();
    const down = new Map<string, string[]>();
    for (const n of nodes) {
      up.set(n.id, []);
      down.set(n.id, []);
    }
    for (const e of layout.edges) {
      down.get(e.from)?.push(e.to);
      up.get(e.to)?.push(e.from);
    }

    const doneIds = new Set(nodes.filter((n) => toneOf(n.status) === 'good').map((n) => n.id));
    const eligible = (id: string): boolean =>
      toneOf(byId.get(id)?.status) === 'idle' && (up.get(id) ?? []).every((p) => doneIds.has(p));

    const lit = this.hover
      ? new Set<string>([this.hover, ...this.reach(this.hover, up), ...this.reach(this.hover, down)])
      : null;

    const edgeParts: SVGTemplateResult[] = layout.edges.map((e) => {
      const dx = Math.max(24, Math.abs(e.x2 - e.x1) / 2);
      const d = `M${e.x1},${e.y1} C${e.x1 + dx},${e.y1} ${e.x2 - dx},${e.y2} ${e.x2},${e.y2}`;
      const on = lit ? lit.has(e.from) && lit.has(e.to) : false;
      const cls = `dk-dag-edge${on ? ' on' : ''}${(e as PlacedEdge).back ? ' back' : ''}`;
      return svg`<path class=${cls} d=${d} marker-end="url(#dk-arrow)"></path>`;
    });

    const nodeParts: SVGTemplateResult[] = layout.nodes.map((pn) => {
      const n = byId.get(pn.id)!;
      const col = colorOf(toneOf(n.status));
      const elig = eligible(pn.id);
      const dim = lit ? !lit.has(pn.id) : false;
      const act = n.action;
      const cls = `dk-dag-node${dim ? ' dim' : ''}${act ? ' act' : ''}`;
      return svg`<g
        class=${cls}
        transform=${`translate(${pn.x},${pn.y})`}
        @mouseenter=${() => {
          this.hover = pn.id;
        }}
        @mouseleave=${() => {
          this.hover = null;
        }}
        @click=${() => {
          if (act) this.onAction?.(act, n.payload ?? { id: pn.id });
        }}
      >
        <rect class=${`dk-dag-box${elig ? ' elig' : ''}`} width=${pn.w} height=${pn.h} rx="8"></rect>
        <rect class="dk-dag-tone" x="0" y="0" width="4" height=${pn.h} rx="2" fill=${col}></rect>
        <circle cx=${pn.w - 12} cy="13" r="4" fill=${col}></circle>
        <text class="dk-dag-lbl" x="13" y="18">${trunc(n.label ?? pn.id, 19)}</text>
        <text class="dk-dag-sub" x="13" y="33">${trunc(n.sub ?? (elig ? 'ready' : n.status ?? ''), 22)}</text>
      </g>`;
    });

    return html`<div class="dk-panel dk-full">
      ${title}${this.legend()}
      <div class="dk-dag-scroll">
        <svg
          class="dk-dag"
          width=${layout.width}
          height=${layout.height}
          viewBox="0 0 ${layout.width} ${layout.height}"
        >
          <defs>
            <marker
              id="dk-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path class="dk-dag-arrowhead" d="M0,0 L8,4 L0,8 z"></path>
            </marker>
          </defs>
          <g class="dk-dag-edges">${edgeParts}</g>
          <g class="dk-dag-nodes">${nodeParts}</g>
        </svg>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dk-dag': DkDag;
  }
}
