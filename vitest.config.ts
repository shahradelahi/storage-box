import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 20000,
    globals: true,
  },
  resolve: {
    alias: {
      '@/tests': resolve(__dirname, 'tests'),
      '@': resolve(__dirname, 'src'),
    },
  },
});
