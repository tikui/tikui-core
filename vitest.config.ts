import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test-environment.js'],
    coverage: {
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/tikui-core.ts'],
      reporter: ['html', 'json-summary', 'text-summary', 'lcov', 'clover'],
    },
  },
});
