import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

/**
 * Local Storybook config for dogfooding the addon. The `./local-preset.ts`
 * entry loads the addon source directly so changes hot-reload without a
 * separate build step.
 *
 * The `viteFinal` widens esbuild's `resolveExtensions` to include `.json`
 * so emojilib (a transitive dep of `slack-blocks-to-jsx`) resolves cleanly
 * when MDX pages pull in the renderer. Without this, `build-storybook`
 * fails on emojilib's `require('./emojis')` (a .json file).
 */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // MDX stories are temporarily excluded from dogfood discovery — emojilib
  // (transitive via slack-blocks-to-jsx) breaks @storybook/addon-docs' MDX
  // preprocessor. See AGENTS.md → "Known risks → MDX preprocessor".
  // stories/DocBlock.mdx is preserved as a reference for the public API.
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', './local-preset.ts'],
  typescript: {
    reactDocgen: 'react-docgen-typescript'
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      optimizeDeps: {
        include: ['slack-blocks-to-jsx', 'emojilib'],
        esbuildOptions: {
          resolveExtensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
        }
      },
      build: {
        commonjsOptions: {
          transformMixedEsModules: true,
          extensions: ['.js', '.cjs', '.json']
        }
      }
    })
};

export default config;
