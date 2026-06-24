import { DodApi } from './api';
import { DodApp } from './dod-app';

declare global {
  interface Window {
    TOKEN?: string;
  }
}

/** Boot the admin UI: read the per-boot token, wire the API, start polling. */
export function boot(root: HTMLElement = document.body): DodApp {
  const app = document.createElement('dod-app') as DodApp;
  app.api = new DodApi(window.TOKEN ?? '');
  root.appendChild(app);
  app.start();
  return app;
}
