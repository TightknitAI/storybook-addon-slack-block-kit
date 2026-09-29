import {
  type ValidateBlockKitOptions,
  type ValidationResult,
  validateBlockKit
} from '@tightknitai/slack-block-kit-validator';
import type { Block } from 'slack-blocks-to-jsx';
import type { SlackEnvelopeOptions, SlackPreviewSurface } from './types';

/**
 * Thin wrapper that maps the addon's surface vocabulary onto the
 * validator's `target` / `surface` options.
 *
 * - `message` surface validates a bare blocks array with surface=`message`.
 * - `modal` / `home` surfaces wrap the blocks in the matching view envelope
 *   so the validator enforces surface-compatibility (e.g. rejects `input`
 *   blocks on messages, `video` on modals, `file_input` outside modals).
 *
 * Failures from the validator are intentionally surfaced as plain strings;
 * see `@tightknitai/slack-block-kit-validator` for the exact wording.
 */
export function validateForSurface(
  blocks: Block[],
  surface: SlackPreviewSurface,
  modal: SlackEnvelopeOptions['modal'] = {}
): ValidationResult {
  if (surface === 'modal') {
    // Same title / submit / close the renderer draws in the modal chrome.
    // Slack requires `submit` on any modal holding an input block, so a
    // story that drops it (`submit: false`) is held to that too.
    const submit = modal.submit === false ? undefined : (modal.submit ?? 'Submit');
    return validateBlockKit(
      {
        type: 'modal',
        title: { type: 'plain_text', text: modal.title ?? 'Modal title' },
        ...(submit ? { submit: { type: 'plain_text', text: submit } } : {}),
        close: { type: 'plain_text', text: modal.close ?? 'Cancel' },
        blocks
      },
      { target: 'modal' } satisfies ValidateBlockKitOptions
    );
  }
  if (surface === 'home') {
    return validateBlockKit({ type: 'home', blocks }, { target: 'home' } satisfies ValidateBlockKitOptions);
  }
  return validateBlockKit(blocks, { target: 'blocks', surface: 'message' });
}
