import { describe, expect, it, vi } from 'vitest';

import { DodList } from './dod-list';
import type { State } from './types';

async function makeList(entries: State[], selected: string | null = null): Promise<DodList> {
  const el = document.createElement('dod-list') as DodList;
  el.entries = entries;
  el.selected = selected;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const live = (id: string): State => ({
  id,
  name: id.toUpperCase(),
  status: 'live',
  state: 'ready',
  controllable: true,
  stop: 'sigterm',
});
const stopped = (id: string): State => ({ id, status: 'stopped', state: 'stopped', cmd: ['x'] });

describe('dod-list', () => {
  it('renders one row per entry with its name and status word', async () => {
    const el = await makeList([live('a'), stopped('b')]);
    const items = el.querySelectorAll('.item');
    expect(items.length).toBe(2);
    expect(items[0]?.querySelector('.nm')?.textContent).toContain('A');
    expect(items[0]?.querySelector('.pill')?.textContent).toContain('live');
    el.remove();
  });

  it('shows the empty state when there are no entries', async () => {
    const el = await makeList([]);
    expect(el.querySelector('.empty')?.textContent).toContain('No projects');
    el.remove();
  });

  it('marks the selected row', async () => {
    const el = await makeList([live('a'), live('b')], 'b');
    const items = Array.from(el.querySelectorAll('.item'));
    expect(items[1]?.classList.contains('sel')).toBe(true);
    expect(items[0]?.classList.contains('sel')).toBe(false);
    el.remove();
  });

  it('clicking a row emits select with the id', async () => {
    const el = await makeList([live('a')]);
    const onSelect = vi.fn();
    el.addEventListener('select', (e) => onSelect((e as CustomEvent<string>).detail));
    el.querySelector<HTMLElement>('.item')?.click();
    expect(onSelect).toHaveBeenCalledWith('a');
    el.remove();
  });

  it('clicking Stop emits action and stops propagation (no select)', async () => {
    const el = await makeList([live('a')]);
    const onAction = vi.fn();
    const onSelect = vi.fn();
    el.addEventListener('action', (e) => onAction((e as CustomEvent).detail));
    el.addEventListener('select', () => onSelect());
    const btn = el.querySelector<HTMLButtonElement>('.btn.stop');
    expect(btn).not.toBeNull();
    btn?.click();
    expect(onAction).toHaveBeenCalledWith({ verb: 'stop', id: 'a' });
    expect(onSelect).not.toHaveBeenCalled();
    el.remove();
  });

  it('replaces the row button with a disabled pending label while an action is in flight', async () => {
    const el = await makeList([live('a')]);
    el.pending = new Map([['a', 'stop']]);
    await el.updateComplete;
    const btn = el.querySelector<HTMLButtonElement>('.btn.pending');
    expect(btn?.disabled).toBe(true);
    expect(btn?.textContent?.trim()).toBe('stopping…');
    expect(el.querySelector('.btn.stop')).toBeNull(); // the normal Stop is gone while pending
    el.remove();
  });

  it('a drag dropped on another row emits reorder {from,to}', async () => {
    const el = await makeList([live('a'), live('b')]);
    const onReorder = vi.fn();
    el.addEventListener('reorder', (e) => onReorder((e as CustomEvent).detail));
    const items = el.querySelectorAll<HTMLElement>('.item');
    items[0]?.dispatchEvent(new Event('dragstart', { bubbles: true }));
    items[1]?.dispatchEvent(new Event('drop', { bubbles: true }));
    expect(onReorder).toHaveBeenCalledWith({ from: 'a', to: 'b' });
    el.remove();
  });
});
