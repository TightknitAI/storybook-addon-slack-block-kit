import type { Block } from 'slack-blocks-to-jsx';
import type { SlackEnvelopeOptions, SlackPreviewSurface } from './types';

/**
 * Human-readable surface names, matching the toolbar's labels.
 */
export const SURFACE_LABELS: Record<SlackPreviewSurface, string> = {
  message: 'Message',
  modal: 'Modal',
  home: 'App Home'
};

/**
 * Wraps blocks in the payload shape Slack expects for the surface:
 *
 *  - `message`: `{ blocks }`
 *  - `modal`:   `{ type: 'modal', title, submit, close, blocks }`
 *  - `home`:    `{ type: 'home', blocks }`
 *
 * The modal envelope uses the same title / submit / close the renderer
 * draws in its modal chrome. Slack requires `submit` on any modal holding
 * an input block, so a story that drops it (`modal.submit: false`) is held
 * to that too. Shared by validation and the Block Kit Builder deeplink so
 * the two can't disagree about what the modal is.
 */
export function wrapForSurface(
  blocks: Block[],
  surface: SlackPreviewSurface,
  modal: SlackEnvelopeOptions['modal'] = {}
) {
  if (surface === 'modal') {
    const submit = modal.submit === false ? undefined : (modal.submit ?? 'Submit');
    return {
      type: 'modal' as const,
      title: { type: 'plain_text' as const, text: modal.title ?? 'Modal title' },
      ...(submit ? { submit: { type: 'plain_text' as const, text: submit } } : {}),
      close: { type: 'plain_text' as const, text: modal.close ?? 'Cancel' },
      blocks
    };
  }
  if (surface === 'home') return { type: 'home' as const, blocks };
  return { blocks };
}
