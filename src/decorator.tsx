import type { Decorator } from '@storybook/react-vite';
import { GLOBAL_SURFACE_KEY, GLOBAL_THEME_KEY, PARAM_KEY } from './constants';
import { Renderer } from './renderer';
import type { SlackBlocksParameter, SlackBlocksParameterObject, SlackPreviewSurface, SlackPreviewTheme } from './types';

function normalize(param: SlackBlocksParameter | undefined | null): SlackBlocksParameterObject | null {
  if (!param) return null;
  if (Array.isArray(param)) return { blocks: param };
  return param;
}

/**
 * Per-story Storybook decorator that renders a Slack preview below the
 * story whenever `parameters.slackBlocks` is set. Stories whose component
 * already accepts a `blocks` arg get a free preview without touching
 * parameters.
 *
 * Theme and surface fall back to Storybook globals
 * (`slackTheme`, `slackSurface`) so the toolbar dropdowns flip every
 * story at once.
 */
export const withSlackPreview: Decorator = (StoryFn, context) => {
  const raw = context.parameters?.[PARAM_KEY] as SlackBlocksParameter | null | undefined;
  // Explicit opt-out: `parameters.slackBlocks = false`. Suppresses the
  // args.blocks fallback below so showcase stories whose component already
  // renders a Slack preview (e.g. SlackPreview itself) don't double up.
  if (raw === false) return <StoryFn />;
  const argBlocks = (context.args as { blocks?: unknown } | undefined)?.blocks;
  const fromArgs = Array.isArray(argBlocks) ? (argBlocks as SlackBlocksParameter) : undefined;

  const param = normalize(raw ?? null) ?? normalize(fromArgs);
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
      <Renderer blocks={param.blocks} theme={theme} surface={surface} hooks={param.hooks} />
    </div>
  );
};
