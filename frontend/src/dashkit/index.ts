import { html, render } from 'lit';

import type { ActionHandler, Spec } from '../types';
import { panel } from './atoms';
import { injectCSS } from './theme';

export const version = '1';

/**
 * Render a spec into an element. Synchronous and idempotent (safe to call every poll).
 * `onAction` routes interact-down button clicks; omit it for a read-only render.
 */
export function renderSpec(spec: Spec, el: HTMLElement, onAction?: ActionHandler): void {
  injectCSS();
  el.classList.add('dk-root');
  const panels = spec.panels ?? [];
  render(
    html`
      ${spec.title ? html`<div class="dk-title">${spec.title}</div>` : ''}
      <div class="dk-panels">${panels.map((p) => panel(p, onAction))}</div>
    `,
    el,
  );
}

export interface MountOpts {
  renderUrl: string;
  mount: HTMLElement | string;
  refreshMs?: number;
  /** Called with (action, payload) when a button fires (the dod pane wires this). */
  onAction?: ActionHandler;
  /** Standalone fallback: POST {action, payload} here when no onAction is given. */
  actionUrl?: string;
}

/** Poll a renderUrl and re-render the spec on a fixed cadence. Returns a stop() handle. */
export function mount(opts: MountOpts): { stop: () => void } {
  const el =
    (typeof opts.mount === 'string'
      ? document.querySelector<HTMLElement>(opts.mount)
      : opts.mount) ?? document.body;
  const { actionUrl } = opts;
  const onAction: ActionHandler | undefined =
    opts.onAction ??
    (actionUrl
      ? (action, payload) => {
          void fetch(actionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
          }).catch(() => {});
        }
      : undefined);
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async (): Promise<void> => {
    if (stopped) return;
    try {
      const spec = (await (await fetch(opts.renderUrl, { cache: 'no-store' })).json()) as Spec;
      if (stopped) return;
      renderSpec(spec, el, onAction);
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
