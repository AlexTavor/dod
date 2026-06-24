import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { ActionHandler, FormField, FormPanel } from '../types';

type FormValue = string | number | boolean | null;

/**
 * The `form` atom: a set of fields that submit as one action. Holds its own values so a
 * render poll never clobbers a field mid-edit (the seed from the spec is skipped while
 * dirty; submitting clears dirty, so the next poll shows the saved value). Light DOM.
 */
@customElement('dk-form')
export class DkForm extends LitElement {
  @property({ attribute: false }) panel: FormPanel = { type: 'form' };
  @property({ attribute: false }) onAction?: ActionHandler;
  @state() private values: Record<string, FormValue> = {};
  @state() private dirty = false;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('panel') && !this.dirty) {
      const v: Record<string, FormValue> = {};
      for (const f of this.panel.fields ?? []) v[f.key] = f.value ?? (f.kind === 'checkbox' ? false : '');
      this.values = v;
    }
  }

  private set(key: string, value: FormValue): void {
    this.values = { ...this.values, [key]: value };
    this.dirty = true;
  }

  private field(f: FormField): TemplateResult {
    const v = this.values[f.key];
    const label = html`<span class="dk-fl">${f.label ?? f.key}</span>`;
    if (f.kind === 'textarea') {
      return html`<label class="dk-f dk-full"
        >${label}<textarea
          .value=${v == null ? '' : String(v)}
          @input=${(e: Event) => this.set(f.key, (e.target as HTMLTextAreaElement).value)}
        ></textarea
      ></label>`;
    }
    if (f.kind === 'select') {
      return html`<label class="dk-f"
        >${label}<select @change=${(e: Event) => this.set(f.key, (e.target as HTMLSelectElement).value)}>
          ${(f.options ?? []).map(
            (o) => html`<option value=${o.value} ?selected=${String(o.value) === String(v)}>${o.label ?? o.value}</option>`,
          )}
        </select></label
      >`;
    }
    if (f.kind === 'checkbox') {
      return html`<label class="dk-f dk-fcheck"
        ><input
          type="checkbox"
          .checked=${!!v}
          @change=${(e: Event) => this.set(f.key, (e.target as HTMLInputElement).checked)}
        />${label}</label
      >`;
    }
    return html`<label class="dk-f"
      >${label}<input
        type=${f.kind === 'number' ? 'number' : 'text'}
        .value=${v == null ? '' : String(v)}
        @input=${(e: Event) => {
          const t = e.target as HTMLInputElement;
          this.set(f.key, f.kind === 'number' ? (t.value === '' ? null : Number(t.value)) : t.value);
        }}
    /></label>`;
  }

  private submit(): void {
    this.onAction?.(this.panel.action ?? 'save', { ...(this.panel.context ?? {}), values: this.values });
    this.dirty = false;
  }

  private cancel(): void {
    this.dirty = false;
    if (this.panel.cancelAction) this.onAction?.(this.panel.cancelAction, {});
  }

  render(): TemplateResult {
    const p = this.panel;
    return html`<div class="dk-panel dk-full">
      ${p.title ? html`<div class="dk-l">${p.title}</div>` : ''}
      <div class="dk-form">${(p.fields ?? []).map((f) => this.field(f))}</div>
      <div class="dk-acts">
        <button class="dk-btn" @click=${() => this.submit()}>${p.submitLabel ?? 'Save'}</button>
        ${p.cancelAction ? html`<button class="dk-btn" @click=${() => this.cancel()}>Cancel</button>` : ''}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dk-form': DkForm;
  }
}
