import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { canStart, canStop, pendingWord, statusWord } from './status';
import type { State } from './types';

/**
 * The left catalog: one row per entry (name, status pill, start/stop button), with
 * drag-to-reorder. Renders into light DOM so the global app.css / dashkit theme apply.
 * Emits: `select` (id), `action` ({verb,id}), `reorder` ({from,to}).
 */
@customElement('dod-list')
export class DodList extends LitElement {
  @property({ attribute: false }) entries: State[] = [];
  @property() selected: string | null = null;
  @property({ attribute: false }) pending = new Map<string, string>();

  private dragId: string | null = null;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  private emit(type: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private button(e: State): TemplateResult | '' {
    const verb = this.pending.get(e.id);
    if (verb) return html`<button class="btn pending" disabled>${pendingWord(verb)}</button>`;
    if (canStop(e)) {
      return html`<button
        class="btn stop"
        @click=${(ev: Event) => {
          ev.stopPropagation();
          this.emit('action', { verb: 'stop', id: e.id });
        }}
      >
        Stop
      </button>`;
    }
    if (canStart(e)) {
      return html`<button
        class="btn"
        @click=${(ev: Event) => {
          ev.stopPropagation();
          this.emit('action', { verb: 'start', id: e.id });
        }}
      >
        Start
      </button>`;
    }
    return '';
  }

  private drop(targetId: string): void {
    const from = this.dragId;
    this.dragId = null;
    if (!from || from === targetId) return;
    this.emit('reorder', { from, to: targetId });
  }

  render(): TemplateResult {
    if (!this.entries.length) {
      return html`<div class="empty" style="padding:30px">
        No projects. Add a dod.project.json to a project, or register one with the CLI.
      </div>`;
    }
    return html`${this.entries.map((e) => {
      const s = statusWord(e);
      return html`<div
        class="item ${e.id === this.selected ? 'sel' : ''}"
        draggable="true"
        @dragstart=${() => {
          this.dragId = e.id;
        }}
        @dragover=${(ev: Event) => ev.preventDefault()}
        @drop=${() => this.drop(e.id)}
        @click=${() => this.emit('select', e.id)}
      >
        <div class="nm">${e.name ?? e.id}</div>
        <div class="right"><span class="pill ${s.cls}">${s.word}</span>${this.button(e)}</div>
        <div class="desc">${e.blurb ?? ''}</div>
      </div>`;
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dod-list': DodList;
  }
}
