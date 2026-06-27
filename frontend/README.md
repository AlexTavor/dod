# dod web UI — dashkit

The dod admin UI and **dashkit**, dod's dashboard renderer, written in TypeScript with
[Lit](https://lit.dev/). This directory is the source; it is dev-only and is not shipped in the
Python wheel.

## dashkit

A dashboard is a flat spec of display atoms, and dashkit draws it:

```js
dashkit.renderSpec(
  {
    title: 'Build',
    panels: [
      { type: 'stat', label: 'passing', value: 142 },
      { type: 'dag', nodes: [/* units with status + dependsOn */] },
    ],
  },
  document.body,
);
```

Atoms cover the common dashboard shapes: `stat`, `progress`, `table`, `kv`, `log`, `badge`,
`prose`, `chart` (line / area / bars / stacked / hbar / diverging / spark), `actions` / `button`,
`form`, `wordcloud`, and `dag` (a fix-dependency graph). An unknown atom renders as a labelled
placeholder, never an error. The build emits a self-contained IIFE that assigns `window.dashkit`
(`renderSpec`, `mount`, `version`), so a plain `<script>` tag is all a page needs.

## How it ties into dod

The Python daemon is stdlib-only and serves the built bundle as static files, so the build is
dev-time only. `npm run build:web` compiles two IIFEs into [`../src/dod/web/`](../src/dod/web):
`dashkit.js` (the renderer) and `app.js` (the admin UI). There is no Node at runtime and none at
`pip install`.

dod uses the one renderer in two hosts: the admin UI (`app.js`) lists the catalog and draws a
managed dashboard's spec in place, and a [kit](../src/dod/kit.py) project loads `dashkit.js` to draw
itself standalone. A project sends data; dashkit draws it the same way wherever it runs.

## Develop

```bash
npm install        # once
npm run dev        # Vite dev server (HMR)
npm run test       # Vitest (jsdom)
npm run typecheck  # tsc --noEmit (strict)
npm run build:web  # build both bundles and copy them into ../src/dod/web
```

`demo/` is a mock-data playground that exercises every atom; open it after a build.

## Layout

```
src/
  types.ts          the spec contract (the Panel union)
  dashkit/          the renderer: atoms, charts, dag-layout, dag-model, dk-* elements, theme
  app/              the admin UI (dod-list, dod-detail, dod-app) + a typed API client
demo/               mock-data playground
```
