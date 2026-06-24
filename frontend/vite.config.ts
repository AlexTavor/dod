import { defineConfig } from 'vitest/config';

// dashkit builds to a self-contained IIFE bundle that assigns `window.dashkit`, so the
// standalone shim and kit projects keep loading it with a plain <script> tag. The output
// is wired into the Python-served path (src/dod/web) in W5; W1 only proves the pipeline.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/dashkit/index.ts',
      name: 'dashkit',
      formats: ['iife'],
      fileName: () => 'dashkit.js',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
