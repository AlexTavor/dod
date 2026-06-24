// The dod control-API contract, mirroring src/dod/models.py. The Python daemon serves these
// shapes over /api; the admin UI is typed against the same contract. Keep in sync with
// models.py (Entry / State / Discovered / StopReason / ActionResult / ReadySpec).

export interface ReadySpec {
  kind?: string;
  path?: string;
  status?: number;
}

export interface StopReason {
  kind?: string; // clean | crash | port-busy
  exit?: number | null;
}

/** The liveness snapshot the sampler computes per entry (supervisor.state). */
export interface State {
  id: string;
  name?: string;
  blurb?: string;
  why?: string;
  tags?: string[];
  type?: string;
  port?: number | null;
  cmd?: string[];
  source?: string;
  provider?: string;
  stop?: string;
  embeddable?: boolean;
  controllable?: boolean;
  log_tail?: string;
  render?: string; // spec | iframe
  state?: string; // ready | external | starting | unhealthy | launched | crashed | stopped | …
  status?: string; // live | stopped
  last_stop_reason?: StopReason | null;
  exit?: number | null;
  crash_note?: string;
  launched_at?: number;
}

export interface Discovered {
  id: string;
  port?: number;
  render?: string;
  name?: string;
  blurb?: string;
  why?: string;
  announced_at?: number;
}

export interface ActionResult {
  ok?: boolean;
  error?: string;
  detail?: string;
  state?: string;
  note?: string;
  id?: string;
}

/** Response shape of GET /api/state. */
export interface ApiState {
  entries: State[];
  discovered: Discovered[];
}
