import { describe, expect, it, vi } from 'vitest';

import type { Panel } from '../types';
import { renderSpec } from './index';

function render1(p: Panel, onAction?: (a: string, payload: unknown) => void): HTMLElement {
  const el = document.createElement('div');
  renderSpec({ panels: [p] }, el, onAction);
  return el;
}

describe('actions / button atoms', () => {
  it('renders a button per entry and fires onAction with action + payload', () => {
    const onAction = vi.fn();
    const el = render1({ type: 'actions', buttons: [{ label: 'Go', action: 'go', payload: { n: 1 } }] }, onAction);
    const btn = el.querySelector<HTMLButtonElement>('.dk-btn');
    expect(btn?.textContent?.trim()).toBe('Go');
    btn?.click();
    expect(onAction).toHaveBeenCalledWith('go', { n: 1 });
  });

  it('the single-button atom renders one button and fires with an empty payload', () => {
    const onAction = vi.fn();
    const el = render1({ type: 'button', label: 'Run', action: 'run' }, onAction);
    expect(el.querySelectorAll('.dk-btn').length).toBe(1);
    el.querySelector<HTMLButtonElement>('.dk-btn')?.click();
    expect(onAction).toHaveBeenCalledWith('run', {});
  });

  it('a click with no handler is a no-op (does not throw)', () => {
    const el = render1({ type: 'actions', buttons: [{ label: 'X', action: 'x' }] });
    expect(() => el.querySelector<HTMLButtonElement>('.dk-btn')?.click()).not.toThrow();
  });

  it('applies the tone class to a button', () => {
    const el = render1({ type: 'actions', buttons: [{ label: 'Del', action: 'del', tone: 'err' }] });
    expect(el.querySelector('.dk-btn')?.classList.contains('err')).toBe(true);
  });
});
