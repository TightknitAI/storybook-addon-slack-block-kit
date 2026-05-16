/**
 * Public entry. Consumers import these for ad-hoc usage outside the
 * addon registration (e.g. inside MDX pages, or to reuse the renderer
 * standalone in a test).
 *
 * The Storybook addon itself is registered via the package's `preset`
 * subpath when listed in `.storybook/main.ts`:
 *
 *   addons: ['@tightknitai/storybook-addon-slack-block-kit']
 */
export { SlackPreview } from './blocks';
export {
  ADDON_ID,
  GLOBAL_SURFACE_KEY,
  GLOBAL_THEME_KEY,
  PANEL_ID,
  PARAM_KEY
} from './constants';
export { withSlackPreview } from './decorator';
export type { RendererProps } from './renderer';
export { Renderer } from './renderer';
export type {
  SlackBlocksParameter,
  SlackBlocksParameterObject,
  SlackPreviewHooks,
  SlackPreviewProps,
  SlackPreviewSurface,
  SlackPreviewTheme
} from './types';
