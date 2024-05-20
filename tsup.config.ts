import { defineConfig } from 'tsup';

export default defineConfig([
  {
    clean: true,
    dts: true,
    minify: true,
    entry: ['src/index.ts', 'src/node.ts', 'src/browser.ts'],
    format: ['cjs', 'esm'],
    target: 'esnext',
    outDir: 'dist',
  },
]);
