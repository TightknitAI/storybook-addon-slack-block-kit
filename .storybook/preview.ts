import type { Preview } from '@storybook/react-vite';

/**
 * Local Storybook preview config. Intentionally minimal — the addon's own
 * `src/preview.ts` (loaded by `local-preset.ts`) registers the decorator
 * and toolbar globals, so we don't need to repeat them here.
 */
const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
