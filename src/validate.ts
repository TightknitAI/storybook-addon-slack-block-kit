import {
  type ValidateBlockKitOptions,
  type ValidationResult,
  validateBlockKit
} from '@tightknitai/slack-block-kit-validator';
import type { Block } from 'slack-blocks-to-jsx';
import type { SlackPreviewSurface } from './types';

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
export function validateForSurface(blocks: Block[], surface: SlackPreviewSurface): ValidationResult {
  if (surface === 'modal') {
    return validateBlockKit({ type: 'modal', title: { type: 'plain_text', text: 'Preview' }, blocks }, {
      target: 'modal'
    } satisfies ValidateBlockKitOptions);
  }
  if (surface === 'home') {
    return validateBlockKit({ type: 'home', blocks }, { target: 'home' } satisfies ValidateBlockKitOptions);
  }
  return validateBlockKit(blocks, { target: 'blocks', surface: 'message' });
}
