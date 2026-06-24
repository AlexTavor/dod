import { describe, expect, it, vi } from 'vitest';

import { DkForm } from './dk-form';
import type { FormPanel } from '../types';

async function makeForm(panel: FormPanel, onAction?: (a: string, p: unknown) => void): Promise<DkForm> {
  const el = document.createElement('dk-form') as DkForm;
  el.panel = panel;
  if (onAction) el.onAction = onAction;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const panel: FormPanel = {
  type: 'form',
  action: 'save',
  submitLabel: 'Go',
  context: { id: 'x' },
  fields: [
    { key: 'name', label: 'Name', value: 'a' },
    { key: 'n', kind: 'number', value: 3 },
    { key: 'on', kind: 'checkbox', value: false },
  ],
};

describe('dk-form', () => {
  it('renders a field per spec field', async () => {
    const el = await makeForm(panel);
    expect(el.querySelectorAll('.dk-f').length).toBe(3);
    expect(el.querySelector('input[type=number]')).not.toBeNull();
    expect(el.querySelector('input[type=checkbox]')).not.toBeNull();
    el.remove();
  });

  it('submits seeded + edited values merged with context', async () => {
    const onAction = vi.fn();
    const el = await makeForm(panel, onAction);
    const name = el.querySelector<HTMLInputElement>('input[type=text]')!;
    name.value = 'bob';
    name.dispatchEvent(new Event('input'));
    await el.updateComplete;
    el.querySelector<HTMLButtonElement>('.dk-btn')!.click();
    expect(onAction).toHaveBeenCalledWith('save', { id: 'x', values: { name: 'bob', n: 3, on: false } });
    el.remove();
  });

  it('does not clobber an edited field when the spec re-renders (no-clobber)', async () => {
    const el = await makeForm(panel);
    const name = el.querySelector<HTMLInputElement>('input[type=text]')!;
    name.value = 'typing';
    name.dispatchEvent(new Event('input'));
    await el.updateComplete;
    el.panel = { ...panel, fields: [{ key: 'name', value: 'server-value' }, ...panel.fields!.slice(1)] };
    await el.updateComplete;
    expect(el.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe('typing');
    el.remove();
  });

  it('cancel fires the cancel action and re-seeds on the next spec', async () => {
    const onAction = vi.fn();
    const el = await makeForm({ ...panel, cancelAction: 'cancel' }, onAction);
    const name = el.querySelector<HTMLInputElement>('input[type=text]')!;
    name.value = 'edited';
    name.dispatchEvent(new Event('input'));
    await el.updateComplete;
    el.querySelectorAll<HTMLButtonElement>('.dk-btn')[1]!.click(); // Cancel
    expect(onAction).toHaveBeenCalledWith('cancel', {});
    el.panel = { ...panel, cancelAction: 'cancel' };
    await el.updateComplete;
    expect(el.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe('a'); // re-seeded
    el.remove();
  });
});
