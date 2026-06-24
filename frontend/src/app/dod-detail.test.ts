import { describe, expect, it, vi } from 'vitest';

import { DodDetail } from './dod-detail';
import type { State } from './types';

async function makeDetail(entry: State | null, mountSpec?: DodDetail['mountSpec']): Promise<DodDetail> {
  const el = document.createElement('dod-detail') as DodDetail;
  if (mountSpec) el.mountSpec = mountSpec;
  el.entry = entry;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('dod-detail', () => {
  it('prompts to select when there is no entry', async () => {
    const el = await makeDetail(null);
    expect(el.querySelector('.empty')?.textContent).toContain('Select a project');
    el.remove();
  });

  it('shows the terminal note', async () => {
    const el = await makeDetail({ id: 'a', type: 'terminal' });
    expect(el.textContent).toContain('Terminal project');
    el.remove();
  });

  it('shows the crash log and a Restart button', async () => {
    const el = await makeDetail({ id: 'a', state: 'crashed', log_tail: 'boom', controllable: true });
    expect(el.querySelector('pre')?.textContent).toContain('boom');
    expect(el.textContent).toContain('Restart');
    el.remove();
  });

  it('iframes an embeddable live non-spec entry', async () => {
    const el = await makeDetail({ id: 'a', status: 'live', state: 'ready', render: 'iframe', embeddable: true, port: 9000 });
    expect(el.querySelector('iframe')?.getAttribute('src')).toContain('9000');
    el.remove();
  });

  it('offers open-in-new-tab when a live entry cannot be embedded', async () => {
    const el = await makeDetail({ id: 'a', status: 'live', state: 'ready', render: 'iframe', embeddable: false, port: 9000 });
    expect(el.textContent).toContain("Can't embed");
    el.remove();
  });

  it('mounts dashkit for a live spec entry, with the right render url', async () => {
    const stop = vi.fn();
    const mountSpec = vi.fn().mockReturnValue({ stop });
    const el = await makeDetail(
      { id: 'cnt', status: 'live', state: 'ready', render: 'spec' },
      mountSpec as unknown as DodDetail['mountSpec'],
    );
    expect(el.querySelector('#dkhost')).not.toBeNull();
    expect(mountSpec).toHaveBeenCalledTimes(1);
    const opts = mountSpec.mock.calls[0]?.[0] as { renderUrl: string } | undefined;
    expect(opts?.renderUrl).toContain('id=cnt');
    el.remove();
  });

  it('stops the dashkit mount when the entry leaves spec mode', async () => {
    const stop = vi.fn();
    const mountSpec = vi.fn().mockReturnValue({ stop });
    const el = await makeDetail(
      { id: 'cnt', status: 'live', state: 'ready', render: 'spec' },
      mountSpec as unknown as DodDetail['mountSpec'],
    );
    el.entry = { id: 'cnt', status: 'stopped', state: 'stopped' };
    await el.updateComplete;
    expect(stop).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('a head/pane action button emits action', async () => {
    const el = await makeDetail({ id: 'a', status: 'stopped', state: 'stopped', cmd: ['x'] });
    const onAction = vi.fn();
    el.addEventListener('action', (e) => onAction((e as CustomEvent).detail));
    el.querySelector<HTMLButtonElement>('.btn')?.click();
    expect(onAction).toHaveBeenCalledWith({ verb: 'start', id: 'a' });
    el.remove();
  });
});
