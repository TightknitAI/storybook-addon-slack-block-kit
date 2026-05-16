import type { Block } from 'slack-blocks-to-jsx';

/**
 * Light or dark theme for the rendered Slack preview.
 * Mirrors `slack-blocks-to-jsx`'s `theme` prop and its `data-theme`
 * CSS scoping.
 */
export type SlackPreviewTheme = 'light' | 'dark';

/**
 * Which Slack surface to render the blocks inside. Blocks always render
 * inside one of these — there is no "bare" option, because seeing the
 * surrounding chrome is the whole point of the preview:
 *  - `message`: a real Slack channel message envelope (avatar, app name,
 *    timestamp, channel-style card)
 *  - `modal`: Slack's modal chrome (title bar + Cancel/Submit footer)
 */
export type SlackPreviewSurface = 'message' | 'modal';

/**
 * Hooks forwarded to `slack-blocks-to-jsx`'s `<Message>` so consumers can
 * resolve user / channel / emoji / link directives to their own UI. See
 * the upstream library for the full hook shape; typed as `unknown`-keyed
 * here to avoid leaking upstream internals into the addon's public API.
 */
export type SlackPreviewHooks = Record<string, unknown>;

/**
 * Object form of the `slackBlocks` story parameter. Lets a story override
 * theme / surface / hooks without touching globals, and pick a layout for
 * where the preview should render.
 *
 * `layout` values:
 *  - `below` (default): renders the preview below the story content
 *  - `panel-only`: hides the inline preview; only the addon panel shows it
 */
export interface SlackBlocksParameterObject {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
  layout?: 'below' | 'panel-only';
}

/**
 * Story parameter shape. Accepts either a bare `Block[]` (most common) or
 * the object form above for finer control. Pass `false` to opt the story
 * out of the decorator entirely — useful for showcase stories whose
 * component already renders a Slack preview (e.g. SlackPreview itself).
 */
export type SlackBlocksParameter = Block[] | SlackBlocksParameterObject | false;

/**
 * Props for the public `<SlackPreview>` component (the MDX doc block).
 */
export interface SlackPreviewProps {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
}
