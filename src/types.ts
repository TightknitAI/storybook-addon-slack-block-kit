import type { ValidationResult } from '@tightknitai/slack-block-kit-validator';
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
 * surrounding chrome is the whole point of the preview.
 *
 *  - `message`: a channel message envelope (avatar, app name, timestamp).
 *  - `modal`: Slack's modal chrome (title bar + Cancel/Submit footer).
 *  - `home`: the App Home tab chrome (Home / Messages / About tabs).
 *
 * The same set is recognized by `@tightknitai/slack-block-kit-validator`
 * as its `Surface` type, so validation runs with the right surface
 * compatibility rules.
 */
export type SlackPreviewSurface = 'message' | 'modal' | 'home';

/**
 * Hooks forwarded to `slack-blocks-to-jsx`'s `<Message>` so consumers can
 * resolve user / channel / emoji / link directives to their own UI.
 *
 * The full shape is defined by the upstream library; this is a permissive
 * record-typed alias so the addon doesn't lock callers into a single
 * version of `slack-blocks-to-jsx`'s exported `Hooks` type. See
 * `stories/Hooks.stories.tsx` for worked examples.
 */
export type SlackPreviewHooks = Record<string, unknown>;

/**
 * Payload describing a single interactive element that fired in the
 * preview's "interactions" simulator. Mirrors the shape Slack would send
 * to your `interactivity_endpoint` for the equivalent block element.
 */
export interface SlackInteractionPayload {
  /** Element kind (button, static_select, datepicker, etc.). */
  type: string;
  /** The `action_id` declared on the element. May be undefined for inputs. */
  action_id?: string;
  /** The `block_id` of the parent block. */
  block_id?: string;
  /** The element's static `value`, if any (buttons). */
  value?: string;
  /** Human-readable label for UI listings. */
  label?: string;
}

/**
 * Object form of the `slackBlocks` story parameter. Lets a story override
 * theme / surface / hooks without touching globals, pick a layout, and
 * subscribe to interaction events from the simulator.
 *
 * `layout` values:
 *  - `below` (default): renders the preview below the story content.
 *  - `panel-only`: hides the inline preview; only the addon panel shows it.
 *
 * `validate`:
 *  - `true` (default): validates against `@tightknitai/slack-block-kit-validator`
 *    and shows findings in the addon panel + inline banner.
 *  - `false`: skips validation entirely (useful when you want to preview a
 *    deliberately-incomplete fixture without distraction).
 */
export interface SlackBlocksParameterObject {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
  layout?: 'below' | 'panel-only';
  validate?: boolean;
  /**
   * Fired when the user clicks "Simulate" on an interactive element in the
   * preview. Wire this to your handler to verify payload shapes without
   * round-tripping through a real Slack workspace.
   */
  onInteraction?: (payload: SlackInteractionPayload) => void;
}

/**
 * Story parameter shape. Accepts:
 *  - a bare `Block[]` (most common),
 *  - the object form above (`SlackBlocksParameterObject`),
 *  - or a function that derives blocks from the story's args (so designers
 *    can drive blocks live from Storybook Controls).
 */
export type SlackBlocksParameter =
  | Block[]
  | SlackBlocksParameterObject
  | ((args: Record<string, unknown>) => Block[] | SlackBlocksParameterObject);

/**
 * Props for the public `<SlackPreview>` component (the MDX doc block).
 */
export interface SlackPreviewProps {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
  /** Pass `false` to hide the inline validator banner. Defaults to `true`. */
  validate?: boolean;
  onInteraction?: (payload: SlackInteractionPayload) => void;
}

export type { ValidationResult };
