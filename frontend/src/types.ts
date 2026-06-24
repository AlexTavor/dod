// The dashkit spec contract: a backend (the Python daemon or a kit) emits a flat spec and
// dashkit renders it. These shapes mirror what src/dod/kit.py and dashboards produce.
//
// W1 added section + stat. W2a adds the stateless atoms below. Charts (ChartPanel) land in
// W2b; the interactive atoms (wordcloud, actions/button, form) land in W4; the dod admin-UI
// types (Entry/State, mirroring src/dod/models.py) arrive in W3.

export interface Spec {
  title?: string;
  refresh_ms?: number;
  panels: Panel[];
}

export interface SectionPanel {
  type: 'section';
  title?: string;
}

export interface StatPanel {
  type: 'stat';
  label?: string;
  value?: number | string | null;
  sub?: string;
}

export interface ProgressPanel {
  type: 'progress';
  label?: string;
  value?: number;
  max?: number;
  pct?: number;
  text?: string;
}

export interface TablePanel {
  type: 'table';
  title?: string;
  columns?: string[];
  rows?: Array<Array<string | number>>;
  /** Per-column alignment; 'right' or 'num' right-aligns and uses tabular figures. */
  align?: string[];
}

export interface KvItem {
  k: string;
  v: string | number;
}

export interface KvPanel {
  type: 'kv';
  title?: string;
  items?: KvItem[];
}

export interface LogPanel {
  type: 'log';
  title?: string;
  text?: string;
  lines?: string[];
}

export interface BadgePanel {
  type: 'badge';
  /** ok | done | run | accent | warn | err — maps to a pill colour. */
  tone?: string;
  text?: string;
}

export interface ProsePanel {
  type: 'prose';
  title?: string;
  text?: string;
}

/** First-party escape hatch: html is inserted unescaped. Never feed it untrusted input. */
export interface HtmlPanel {
  type: 'html';
  html?: string;
}

export interface Series {
  name?: string;
  values: Array<number | null>;
}

export interface ChartMarker {
  x: string | number;
  label?: string;
  /** accent | err | ok tints the marker line and label. */
  tone?: string;
}

export interface ChartPanel {
  type: 'chart';
  kind?: 'line' | 'area' | 'bars' | 'stacked' | 'spark' | 'hbar' | 'diverging';
  title?: string;
  series?: Series[];
  /** Single-series shorthand for `series: [{ values }]`. */
  values?: Array<number | null>;
  /** X-axis labels; defaults to indices. */
  x?: Array<string | number>;
  label?: string;
  color?: number;
  markers?: ChartMarker[];
  /** diverging only: left/right axis captions. */
  left?: string;
  right?: string;
}

/** Routes an interact-down action to its handler (dod's proxy, or a standalone POST). */
export type ActionHandler = (action: string, payload: unknown) => void;

export interface ActionButton {
  label?: string;
  action?: string;
  payload?: Record<string, unknown>;
  /** Button colour: ok | accent | warn | err. */
  tone?: string;
}

export interface ActionsPanel {
  type: 'actions';
  title?: string;
  buttons?: ActionButton[];
}

export interface ButtonPanel {
  type: 'button';
  title?: string;
  label?: string;
  action?: string;
  payload?: Record<string, unknown>;
  tone?: string;
}

/** Any atom dashkit does not (yet) know: rendered as a labelled fallback, never thrown. */
export interface UnknownPanel {
  type: string;
  [key: string]: unknown;
}

export type Panel =
  | SectionPanel
  | StatPanel
  | ProgressPanel
  | TablePanel
  | KvPanel
  | LogPanel
  | BadgePanel
  | ProsePanel
  | HtmlPanel
  | ChartPanel
  | ActionsPanel
  | ButtonPanel
  | UnknownPanel;
