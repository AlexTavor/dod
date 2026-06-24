// The dashkit spec contract: a backend (the Python daemon or a kit) emits a flat spec and
// dashkit renders it. These shapes mirror what src/dod/kit.py and dashboards produce.
//
// W1 types the two atoms the skeleton renders (section, stat). The rest of the atom union
// (chart, table, kv, log, wordcloud, form, actions, badge, prose, html) is filled in in W2,
// and the dod admin-UI types (Entry/State, mirroring src/dod/models.py) arrive in W3.

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

/** Any atom dashkit does not (yet) know: rendered as a labelled fallback, never thrown. */
export interface UnknownPanel {
  type: string;
  [key: string]: unknown;
}

export type Panel = SectionPanel | StatPanel | UnknownPanel;
