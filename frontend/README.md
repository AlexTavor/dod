# dod web UI (TypeScript + Lit)

The dod admin UI and the **dashkit** spec renderer, written in TypeScript with
[Lit](https://lit.dev/). This directory holds the **sources**; it is dev-only and is **not
shipped in the Python wheel**.

## The runtime rule

dod's daemon is stdlib-only and serves its web assets as static files. So the build is
**dev-time only**: `npm run build` emits a bundle that is committed into
[`../src/dod/web/`](../src/dod/web), and the Python server serves it. There is **no Node at
runtime and none at `pip install`**. The browser bundle uses Lit; the Python side never does.

## Commands

```
npm install        # once
npm run dev        # Vite dev server (HMR) — proxy to a running dod is added in a later wave
npm run test       # Vitest (happy-dom)
npm run typecheck  # tsc --noEmit (strict)
npm run build      # Vite library build → dist/ (wired into src/dod/web in W5)
```

## Layout

```
src/
  types.ts            the spec contract (mirrors src/dod/models.py shapes)
  dashkit/
    index.ts          renderSpec + mount, exposed as window.dashkit
    atoms.ts          one render function per atom (section, stat so far)
    dashkit.test.ts   Vitest specs
```

`dashkit` builds to a self-contained IIFE that assigns `window.dashkit`
(`mount` / `renderSpec` / `version`), so the standalone shim and kit projects keep loading
it with a plain `<script>` tag — that public API stays stable across the rewrite.

## Status

Skeleton-first migration. **W1** (this) proves the toolchain end-to-end: build → test →
(later) serve-through-Python. Remaining atoms + SVG charts (W2), the admin UI as components
+ a typed API client (W3), interactive atoms + drag-reorder (W4), then deleting the legacy
raw JS and pointing the server at the build (W5).
