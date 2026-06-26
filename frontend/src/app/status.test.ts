import { describe, expect, it } from 'vitest';

import { canStart, canStop, isLive, pendingWord, statusWord } from './status';
import type { State } from './types';

const e = (o: Partial<State>): State => ({ id: 'x', ...o });

describe('statusWord (total over the state machine)', () => {
  it('starting', () => {
    expect(statusWord(e({ state: 'starting' }))).toEqual({ word: 'starting…', cls: 'starting' });
  });
  it('unhealthy', () => {
    expect(statusWord(e({ state: 'unhealthy' }))).toEqual({ word: 'unhealthy', cls: 'unhealthy' });
  });
  it('live', () => {
    expect(statusWord(e({ status: 'live', state: 'ready' }))).toEqual({ word: 'live', cls: 'live' });
  });
  it('crash with an exit code', () => {
    expect(
      statusWord(e({ status: 'stopped', state: 'crashed', last_stop_reason: { kind: 'crash', exit: 2 } })),
    ).toEqual({ word: 'crashed (exit 2)', cls: 'crash' });
  });
  it('crash without an exit code', () => {
    expect(statusWord(e({ last_stop_reason: { kind: 'crash', exit: null } }))).toEqual({
      word: 'crashed',
      cls: 'crash',
    });
  });
  it('port busy', () => {
    expect(statusWord(e({ last_stop_reason: { kind: 'port-busy' } }))).toEqual({ word: 'port busy', cls: 'crash' });
  });
  it('stopped (no reason)', () => {
    expect(statusWord(e({ status: 'stopped' }))).toEqual({ word: 'stopped', cls: 'stopped' });
  });
});

describe('canStart / canStop', () => {
  it('canStart: stopped with a launch cmd', () => {
    expect(canStart(e({ status: 'stopped', cmd: ['node', 'x'] }))).toBe(true);
  });
  it('canStart: false when live', () => {
    expect(canStart(e({ status: 'live', cmd: ['x'] }))).toBe(false);
  });
  it('canStart: false without a cmd (adopt-only)', () => {
    expect(canStart(e({ status: 'stopped', cmd: [] }))).toBe(false);
  });
  it('canStop: live, controllable, not leave', () => {
    expect(canStop(e({ status: 'live', controllable: true, stop: 'sigterm' }))).toBe(true);
  });
  it('canStop: false for adopt-only (stop=leave)', () => {
    expect(canStop(e({ status: 'live', controllable: true, stop: 'leave' }))).toBe(false);
  });
  it('canStop: false when not controllable', () => {
    expect(canStop(e({ status: 'live', controllable: false }))).toBe(false);
  });
  it('isLive reflects status', () => {
    expect(isLive(e({ status: 'live' }))).toBe(true);
    expect(isLive(e({ status: 'stopped' }))).toBe(false);
  });
});

describe('pendingWord', () => {
  // The verb→label data lives in a map (declarative); only the fallback is logic worth testing.
  it('falls back to the start label for an unknown verb', () => {
    expect(pendingWord('???')).toBe('starting…');
  });
});
