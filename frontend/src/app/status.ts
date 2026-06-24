// The status word + capability checks shown for an entry, ported from app.js. Pure functions
// over a State, so they are trivially testable and the UI components stay thin.

import type { State } from './types';

export interface StatusBadge {
  /** The single human word shown in the pill. */
  word: string;
  /** The pill CSS class. */
  cls: string;
}

export const isLive = (e: State): boolean => e.status === 'live';

/** The one status word + pill class for an entry. Total over the state machine. */
export function statusWord(e: State): StatusBadge {
  if (e.state === 'starting') return { word: 'starting…', cls: 'starting' };
  if (e.state === 'unhealthy') return { word: 'unhealthy', cls: 'unhealthy' };
  if (isLive(e)) return { word: 'live', cls: 'live' };
  const r = e.last_stop_reason;
  if (r && r.kind === 'crash') {
    return { word: `crashed${r.exit != null ? ` (exit ${r.exit})` : ''}`, cls: 'crash' };
  }
  if (r && r.kind === 'port-busy') return { word: 'port busy', cls: 'crash' };
  return { word: 'stopped', cls: 'stopped' };
}

/** Offer Start only when it is not live and dod knows how to launch it. */
export const canStart = (e: State): boolean => !isLive(e) && (e.cmd?.length ?? 0) > 0;

/** Offer Stop only when it is live, dod-controlled, and not an adopt-only (stop=leave) entry. */
export const canStop = (e: State): boolean => isLive(e) && !!e.controllable && e.stop !== 'leave';
