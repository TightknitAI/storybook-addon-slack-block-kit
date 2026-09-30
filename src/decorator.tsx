import type { Decorator } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { useChannel } from 'storybook/preview-api';
import { EVENT_SIMULATE, GLOBAL_SURFACE_KEY, GLOBAL_THEME_KEY, PARAM_KEY } from './constants';
import { Renderer } from './renderer';
import { resolveParameter } from './resolve';
import type { SlackBlocksParameter, SlackInteractionPayload, SlackPreviewSurface, SlackPreviewTheme } from './types';

/**
 * Per-story Storybook decorator that renders a Slack preview below the
 * story whenever `parameters.slackBlocks` is set.
 *
 * Three ways for a story to supply blocks:
 *  1. `parameters.slackBlocks: Block[]` — most common.
 *  2. `parameters.slackBlocks: { blocks, theme?, surface?, ... }` — for
 *     per-story overrides, envelope details and `onInteraction` wiring.
 *  3. `parameters.slackBlocks: (args) => Block[] | { blocks, ... }` —
 *     derive blocks from Storybook Controls so designers can tweak text /
 *     options live.
 *
 * If the parameter is unset, the decorator falls back to `args.blocks`
 * (the story-arg form) so components that already expose a `blocks` arg
 * get a free preview. See `./resolve`.
 *
 * Theme and surface fall back to Storybook globals
 * (`slackTheme`, `slackSurface`) so the toolbar dropdowns flip every
 * story at once.
 *
 * Interactions — a click on a rendered button, or "Simulate" in the addon
 * panel — go to the story's `onInteraction` and to the Actions panel.
 */
export const withSlackPreview: Decorator = (StoryFn, context) => {
  const raw = context.parameters?.[PARAM_KEY] as SlackBlocksParameter | null | undefined;
  const param = resolveParameter(raw, context.args as Record<string, unknown> | undefined);

  const fire = (payload: SlackInteractionPayload) => {
    param?.onInteraction?.(payload);
    action(`slack: ${payload.type}${payload.action_id ? ` ${payload.action_id}` : ''}`)(payload);
  };
  useChannel({ [EVENT_SIMULATE]: fire }, [param]);

  if (!param || param.layout === 'panel-only') return <StoryFn />;

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
        name={param.name}
        logo={param.logo}
        time={param.time}
        modal={param.modal}
        width={param.width}
        chrome={param.chrome}
        validate={param.validate}
        onInteraction={fire}
      />
    </div>
  );
};
