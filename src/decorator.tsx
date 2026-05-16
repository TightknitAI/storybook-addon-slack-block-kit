import type { Decorator } from '@storybook/react-vite';
import { GLOBAL_SURFACE_KEY, GLOBAL_THEME_KEY, PARAM_KEY } from './constants';
import { Renderer } from './renderer';
import type { SlackBlocksParameter, SlackBlocksParameterObject, SlackPreviewSurface, SlackPreviewTheme } from './types';

/**
 * Coerces every supported `slackBlocks` shape into the object form the
 * renderer expects:
 *  - bare `Block[]`  → `{ blocks }`
 *  - object form     → passthrough
 *  - function form   → invoked with the story's args, then re-coerced
 *
 * Returns `null` when no preview should render (e.g. parameter unset or
 * function returned an empty/invalid value).
 */
function normalize(
  param: SlackBlocksParameter | undefined | null,
  args: Record<string, unknown> | undefined
): SlackBlocksParameterObject | null {
  if (!param) return null;
  if (typeof param === 'function') {
    return normalize(param(args ?? {}), args);
  }
  if (Array.isArray(param)) return { blocks: param };
  return param;
}

/**
 * Per-story Storybook decorator that renders a Slack preview below the
 * story whenever `parameters.slackBlocks` is set.
 *
 * Three ways for a story to supply blocks:
 *  1. `parameters.slackBlocks: Block[]` — most common.
 *  2. `parameters.slackBlocks: { blocks, theme?, surface?, ... }` — for
 *     per-story overrides + `onInteraction` wiring.
 *  3. `parameters.slackBlocks: (args) => Block[] | { blocks, ... }` —
 *     derive blocks from Storybook Controls so designers can tweak text /
 *     options live.
 *
 * If the parameter is unset, the decorator falls back to `args.blocks`
 * (the story-arg form) so components that already expose a `blocks` arg
 * get a free preview.
 *
 * Theme and surface fall back to Storybook globals
 * (`slackTheme`, `slackSurface`) so the toolbar dropdowns flip every
 * story at once.
 */
export const withSlackPreview: Decorator = (StoryFn, context) => {
  const raw = (context.parameters?.[PARAM_KEY] ?? null) as SlackBlocksParameter | null;
  const args = context.args as Record<string, unknown> | undefined;
  const argBlocks = (args as { blocks?: unknown } | undefined)?.blocks;
  const fromArgs = Array.isArray(argBlocks) ? (argBlocks as SlackBlocksParameter) : undefined;

  const param = normalize(raw, args) ?? normalize(fromArgs, args);
  if (!param) return <StoryFn />;

  if (param.layout === 'panel-only') return <StoryFn />;

  const globals = context.globals as Record<string, unknown> | undefined;
  const theme: SlackPreviewTheme =
    param.theme ?? ((globals?.[GLOBAL_THEME_KEY] as SlackPreviewTheme | undefined) || 'light');
  const surface: SlackPreviewSurface =
    param.surface ?? ((globals?.[GLOBAL_SURFACE_KEY] as SlackPreviewSurface | undefined) || 'message');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StoryFn />
      <Renderer
        blocks={param.blocks}
        theme={theme}
        surface={surface}
        hooks={param.hooks}
        validate={param.validate}
        onInteraction={param.onInteraction}
      />
    </div>
  );
};
