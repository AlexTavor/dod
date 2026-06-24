import { html, render } from 'lit';

import type { Spec } from '../types';
import { panel } from './atoms';

export const version = '1';

/** Render a spec into an element. Synchronous and idempotent (safe to call every poll). */
export function renderSpec(spec: Spec, el: HTMLElement): void {
  el.classList.add('dk-root');
  const panels = spec.panels ?? [];
  render(
    html`
      ${spec.title ? html`<div class="dk-title">${spec.title}</div>` : ''}
      <div class="dk-panels">${panels.map(panel)}</div>
    `,
    el,
  );
}

export interface MountOpts {
  renderUrl: string;
  mount: HTMLElement | string;
  refreshMs?: number;
}

/** Poll a renderUrl and re-render the spec on a fixed cadence. Returns a stop() handle. */
export function mount(opts: MountOpts): { stop: () => void } {
  const el =
    (typeof opts.mount === 'string'
      ? document.querySelector<HTMLElement>(opts.mount)
      : opts.mount) ?? document.body;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async (): Promise<void> => {
    if (stopped) return;
    try {
      const spec = (await (await fetch(opts.renderUrl, { cache: 'no-store' })).json()) as Spec;
      if (stopped) return;
      renderSpec(spec, el);
    } catch {
      /* keep the last good render up; the next tick retries */
    }
    timer = setTimeout(() => void tick(), opts.refreshMs ?? 3000);
  };

  void tick();
  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
