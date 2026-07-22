import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import type { ActionHandler, Panel, Spec } from '../types';
import { panel } from './atoms';
import { injectCSS } from './theme';

export const version = '1';

/**
 * A stable identity for one panel across renders. A producer-supplied `id` wins; otherwise
 * the position is the identity, which matches the old unkeyed behaviour for that panel.
 * The two are namespaced apart so an id of "3" can never collide with index 3.
 */
const panelKey = (p: Panel, i: number): string =>
  typeof (p as { id?: unknown }).id === 'string' ? `id:${(p as { id: string }).id}` : `ix:${i}`;

/**
 * Render a spec into an element. Synchronous and idempotent (safe to call every poll).
 * `onAction` routes interact-down button clicks; omit it for a read-only render.
 *
 * Panels are keyed. Unkeyed, Lit reuses DOM by position, so inserting or removing a panel
 * above a stateful atom hands that atom's DOM to a different panel: a half-filled `dk-form`
 * loses its values, `dk-wordcloud` loses its selected facet, and `dk-dag` loses its hover and
 * its scroll position. The daemon re-renders every few seconds, so this fires on any spec
 * whose panel list changes shape while someone is typing.
 */
export function renderSpec(spec: Spec, el: HTMLElement, onAction?: ActionHandler): void {
  injectCSS();
  el.classList.add('dk-root');
  const panels = spec.panels ?? [];
  render(
    html`
      ${spec.title ? html`<div class="dk-title">${spec.title}</div>` : ''}
      <div class="dk-panels">
        ${repeat(panels, panelKey, (p) => panel(p, onAction))}
      </div>
    `,
    el,
  );
}

export interface MountOpts {
  renderUrl: string;
  mount: HTMLElement | string;
  /** Fallback cadence, used only when the spec carries no `refresh_ms` of its own. */
  refreshMs?: number;
  /** Called with (action, payload) when a button fires (the dod pane wires this). */
  onAction?: ActionHandler;
  /** Standalone fallback: POST {action, payload} here when no onAction is given. */
  actionUrl?: string;
}

/** The smallest cadence a spec may ask for. A producer that emits 0, a negative, or a
 *  fraction would otherwise turn the poll loop into a tight fetch loop against the daemon. */
const MIN_REFRESH_MS = 250;
const DEFAULT_REFRESH_MS = 3000;

/** The next poll delay: the spec's own `refresh_ms` when it is usable, else the mount option,
 *  else the default. `refresh_ms` has been in the Spec type and emitted by kit.py all along;
 *  until now the loop ignored it and every dashboard polled at the hardcoded default. */
export function refreshDelay(spec: Spec | null, fallbackMs?: number): number {
  const asked = Number(spec?.refresh_ms);
  if (Number.isFinite(asked) && asked > 0) return Math.max(MIN_REFRESH_MS, asked);
  const opt = Number(fallbackMs);
  if (Number.isFinite(opt) && opt > 0) return Math.max(MIN_REFRESH_MS, opt);
  return DEFAULT_REFRESH_MS;
}

/** Poll a renderUrl and re-render the spec on the spec's own cadence. Returns a stop() handle. */
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

  // The last spec that rendered, so a failed poll keeps polling at the cadence that spec
  // asked for rather than snapping back to the default.
  let last: Spec | null = null;

  const tick = async (): Promise<void> => {
    if (stopped) return;
    try {
      const spec = (await (await fetch(opts.renderUrl, { cache: 'no-store' })).json()) as Spec;
      if (stopped) return;
      last = spec;
      renderSpec(spec, el, onAction);
    } catch {
      /* keep the last good render up; the next tick retries */
    }
    timer = setTimeout(() => void tick(), refreshDelay(last, opts.refreshMs));
  };

  void tick();
  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
