import type { Block } from 'slack-blocks-to-jsx';
import type { SlackPreviewSurface } from './types';

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
 *  - `modal`:   `{ type: 'modal', title, close, submit, blocks }`
 *  - `home`:    `{ type: 'home', blocks }`
 *
 * The modal envelope always carries `submit`: Slack requires it whenever
 * the view contains an `input` block, and the preview's modal chrome
 * always draws a Submit button, so leaving it off would flag every modal
 * form with a `(root)` error the story author has no way to fix.
 */
export function wrapForSurface(blocks: Block[], surface: SlackPreviewSurface) {
  if (surface === 'modal') {
    return {
      type: 'modal' as const,
      title: { type: 'plain_text' as const, text: 'Preview' },
      close: { type: 'plain_text' as const, text: 'Cancel' },
      submit: { type: 'plain_text' as const, text: 'Submit' },
      blocks
    };
  }
  if (surface === 'home') return { type: 'home' as const, blocks };
  return { blocks };
}
