import type { Decorator } from '@storybook/react-vite';
import { GLOBAL_SURFACE_KEY, GLOBAL_THEME_KEY } from './constants';
import { withSlackPreview } from './decorator';

/**
 * Preview-side annotations merged into every consuming Storybook when this
 * addon is listed in `.storybook/main.ts`. Storybook auto-merges the named
 * exports below (`decorators`, `globalTypes`, `initialGlobals`).
 */
export const decorators: Decorator[] = [withSlackPreview];

export const globalTypes = {
  [GLOBAL_THEME_KEY]: {
    name: 'Slack theme',
    description: 'Theme for the Slack Block Kit preview',
    toolbar: {
      title: 'Slack theme',
      icon: 'paintbrush',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' }
      ],
      dynamicTitle: true
    }
  },
  [GLOBAL_SURFACE_KEY]: {
    name: 'Slack surface',
    description: 'Surface chrome for the Slack Block Kit preview',
    toolbar: {
      title: 'Slack surface',
      icon: 'mobile',
      items: [
        { value: 'message', title: 'Message' },
        { value: 'modal', title: 'Modal' }
      ],
      dynamicTitle: true
    }
  }
} as const;

export const initialGlobals = {
  [GLOBAL_THEME_KEY]: 'light',
  [GLOBAL_SURFACE_KEY]: 'message'
};
