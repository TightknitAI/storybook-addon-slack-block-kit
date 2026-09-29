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
 * preview — clicked on the canvas or simulated from the addon panel. Mirrors the shape Slack would send
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
 * What surrounds the blocks in the rendered surface. Set these to match
 * your real app so a screenshot of the story reads as the real thing.
 */
export interface SlackEnvelopeOptions {
  /** App name in the message envelope. Defaults to "Storybook App". */
  name?: string;
  /** Avatar URL in the message envelope. Defaults to an inline Slack-style "S". */
  logo?: string;
  /**
   * Message timestamp. Defaults to the time of render — pin it for
   * snapshots that shouldn't change from one run to the next.
   */
  time?: Date | string | number;
  /**
   * Modal chrome. `submit: false` drops the Submit button (and validates
   * the modal without one, the way Slack would).
   */
  modal?: {
    /** Defaults to "Modal title". */
    title?: string;
    /** Defaults to "Submit". */
    submit?: string | false;
    /** Defaults to "Cancel". */
    close?: string;
  };
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
 *    and shows findings in the addon panel.
 *  - `false`: skips validation entirely (useful when you want to preview a
 *    deliberately-incomplete fixture without distraction).
 *
 * `chrome`: the canvas shows only the Slack surface by default, so the
 * story screenshots cleanly; validation, interactions and Copy JSON live
 * in the addon panel. `true` also draws them inline around the preview.
 */
export interface SlackBlocksParameterObject extends SlackEnvelopeOptions {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
  layout?: 'below' | 'panel-only';
  validate?: boolean;
  chrome?: boolean;
  /**
   * Fired when an interactive element is clicked in the preview, or
   * "Simulate"d from the addon panel. Every payload is also logged to
   * Storybook's Actions panel. Wire this to your handler to verify payload
   * shapes without round-tripping through a real Slack workspace.
   */
  onInteraction?: (payload: SlackInteractionPayload) => void;
}

/**
 * Story parameter shape. Accepts:
 *  - a bare `Block[]` (most common),
 *  - the object form above (`SlackBlocksParameterObject`),
 *  - a function that derives blocks from the story's args (so designers
 *    can drive blocks live from Storybook Controls),
 *  - or `false` to opt the story out of the decorator entirely — useful for
 *    showcase stories whose component already renders a Slack preview
 *    (e.g. SlackPreview itself).
 */
export type SlackBlocksParameter =
  | Block[]
  | SlackBlocksParameterObject
  | ((args: Record<string, unknown>) => Block[] | SlackBlocksParameterObject)
  | false;

/**
 * Props for the public `<SlackPreview>` component (the MDX doc block).
 */
export interface SlackPreviewProps extends SlackEnvelopeOptions {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
  /**
   * Draw the Copy JSON / Builder toolbar, validation banner and
   * interaction simulator around the preview. Defaults to `false`, so the
   * preview is just the Slack surface.
   */
  chrome?: boolean;
  /** With `chrome`, pass `false` to hide the validation banner. Defaults to `true`. */
  validate?: boolean;
  onInteraction?: (payload: SlackInteractionPayload) => void;
}

export type { ValidationResult };
