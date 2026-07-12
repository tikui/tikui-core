import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/tikui-core.ts',
    'src/express.ts',
    'src/preview.ts',
    'src/assets-build.ts',
    'src/pug-build.ts',
  ],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  outExtensions: () => ({ js: '.js' }),
  sourcemap: true,
});
