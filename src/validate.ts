import {
  checkSurfaceCompatibility,
  type ValidateBlockKitOptions,
  type ValidationResult,
  validateBlockKit
} from '@tightknitai/slack-block-kit-validator';
import type { Block } from 'slack-blocks-to-jsx';
import { wrapForSurface } from './envelope';
import type { SlackPreviewSurface } from './types';

/**
 * Validation result split by kind, so the UI can tell "Slack won't accept
 * this on the current surface" apart from "this payload is malformed".
 */
export interface SurfaceValidationResult extends ValidationResult {
  /** The surface the payload was validated against. */
  surface: SlackPreviewSurface;
  /** Blocks/elements (or block counts) the surface doesn't accept. */
  surfaceErrors: string[];
  /** Everything else: schema violations, duplicate ids, per-payload limits. */
  otherErrors: string[];
}

// Every surface-compatibility message the validator emits names the
// surface ("…not allowed on surface 'home'", "…only allowed in modal
// surfaces…", "surface 'message' allows at most 50 blocks…").
const SURFACE_ERROR = /\bsurfaces?\b/;

export function isSurfaceError(message: string): boolean {
  return SURFACE_ERROR.test(message);
}

/**
 * Validates blocks the way Slack will see them on the given surface.
 *
 * `modal` / `home` wrap the blocks in the matching view envelope (see
 * `wrapForSurface`); `message` validates the bare array with
 * `surface: 'message'`. The validator applies its surface-compatibility
 * rules from there — which blocks each surface accepts, `file_input`
 * outside modals, the 50-block message cap. The full rule set lives in
 * `@tightknitai/slack-block-kit-validator`, not here.
 *
 * The validator skips its surface checks when the schema rejects the
 * payload, which would hide "won't render on this surface" behind an
 * unrelated typo. So whenever the payload is invalid, the surface check
 * is re-run directly and its findings merged in.
 */
export function validateForSurface(blocks: Block[], surface: SlackPreviewSurface): SurfaceValidationResult {
  const options: ValidateBlockKitOptions =
    surface === 'message' ? { target: 'blocks', surface: 'message' } : { target: surface };
  const input = surface === 'message' ? blocks : wrapForSurface(blocks, surface);
  const result = validateBlockKit(input, options);

  const errors = [...result.errors];
  if (!result.valid && Array.isArray(blocks)) {
    for (const message of checkSurfaceCompatibility(
      blocks as Parameters<typeof checkSurfaceCompatibility>[0],
      surface
    )) {
      if (!errors.includes(message)) errors.push(message);
    }
  }

  const surfaceErrors = errors.filter(isSurfaceError);
  const otherErrors = errors.filter((message) => !isSurfaceError(message));
  return { valid: errors.length === 0, errors, surface, surfaceErrors, otherErrors };
}
