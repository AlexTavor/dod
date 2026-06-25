import { defineConfig } from 'vitest/config';

// Two self-contained IIFE bundles, both committed into ../src/dod/web and served statically
// by the stdlib-only Python daemon (see `npm run build:web`):
//   - dashkit.js: the renderer, assigns `window.dashkit` (kit projects + the shim load it).
//   - app.js: the admin UI (boots on load; dashkit is bundled in).
// `BUILD_TARGET=app` switches the entry; the dashkit build runs first and cleans dist, the
// app build adds app.js alongside it.
const isApp = process.env.BUILD_TARGET === 'app';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: !isApp,
    lib: isApp
      ? { entry: 'src/app/main.ts', name: 'dodApp', formats: ['iife'], fileName: () => 'app.js' }
      : { entry: 'src/dashkit/index.ts', name: 'dashkit', formats: ['iife'], fileName: () => 'dashkit.js' },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
