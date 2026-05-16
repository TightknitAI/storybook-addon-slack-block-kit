import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    preview: 'src/preview.ts',
    manager: 'src/manager.tsx',
    preset: 'src/preset.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  target: 'es2022',
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', 'storybook', '@storybook/react-vite', 'slack-blocks-to-jsx']
});
