import { describe, expect, it } from 'vitest';

import { DkWordcloud } from './dk-wordcloud';
import type { WordcloudPanel } from '../types';

async function makeWc(panel: WordcloudPanel): Promise<DkWordcloud> {
  const el = document.createElement('dk-wordcloud') as DkWordcloud;
  el.panel = panel;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const byText = (el: HTMLElement, text: string): HTMLButtonElement =>
  Array.from(el.querySelectorAll<HTMLButtonElement>('.dk-tg-b')).find((b) => b.textContent?.trim() === text)!;

const panel: WordcloudPanel = {
  type: 'wordcloud',
  title: 'Terms',
  facets: [
    { key: 'a', label: 'Lens A', terms: [{ text: 'alpha', weight: 9 }, { text: 'beta', weight: 4 }] },
    { key: 'b', label: 'Lens B', terms: [{ text: 'gamma', weight: 7 }] },
  ],
};

describe('dk-wordcloud', () => {
  it('renders the cloud view with a span per term', async () => {
    const el = await makeWc(panel);
    expect(el.querySelectorAll('.dk-cloud span').length).toBe(2);
    el.remove();
  });

  it('toggles to the bars view (an svg, no cloud)', async () => {
    const el = await makeWc(panel);
    byText(el, 'bars').click();
    await el.updateComplete;
    expect(el.querySelector('.dk-wc-body svg')).not.toBeNull();
    expect(el.querySelector('.dk-cloud')).toBeNull();
    el.remove();
  });

  it('switches the lens (facet) via the toggle', async () => {
    const el = await makeWc(panel);
    byText(el, 'Lens B').click();
    await el.updateComplete;
    const spans = Array.from(el.querySelectorAll('.dk-cloud span')).map((s) => s.textContent);
    expect(spans).toEqual(['gamma']);
    el.remove();
  });

  it('shows a message when there are no terms', async () => {
    const el = await makeWc({ type: 'wordcloud', facets: [] });
    expect(el.textContent).toContain('no terms available');
    el.remove();
  });
});
