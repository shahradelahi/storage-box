import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/driver/index.ts', 'src/parser/index.ts'],
  format: ['cjs', 'esm'],
  sourcemap: true,
  target: 'esnext',
  outDir: 'dist'
});
