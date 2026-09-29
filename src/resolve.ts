import type { Block } from 'slack-blocks-to-jsx';
import type { SlackBlocksParameter, SlackBlocksParameterObject } from './types';

const THEMES = new Set(['light', 'dark']);
const SURFACES = new Set(['message', 'modal', 'home']);

function coerce(
  param: SlackBlocksParameter | undefined | null,
  args: Record<string, unknown>
): SlackBlocksParameterObject | null {
  if (!param) return null;
  if (typeof param === 'function') return coerce(param(args), args);
  if (Array.isArray(param)) return { blocks: param };
  return Array.isArray(param.blocks) ? param : null;
}

/**
 * Turns a story's `slackBlocks` parameter into the object form, the same
 * way on both sides of Storybook — the preview decorator draws from it and
 * the manager panel validates, copies and simulates from it, so the two
 * can't disagree about which payload the story is showing.
 *
 *  - bare `Block[]`  → `{ blocks }`
 *  - object form     → passthrough
 *  - function form   → called with the story's args, then re-coerced
 *  - unset           → falls back to `args.blocks` (plus `args.theme`,
 *                      `args.surface` and `args.width`), so a component
 *                      that already takes a `blocks` arg gets a preview
 *                      for free
 *  - `false`         → opted out; `null`
 *
 * Returns `null` when the story has nothing to preview.
 */
export function resolveParameter(
  raw: SlackBlocksParameter | null | undefined,
  args: Record<string, unknown> | undefined
): SlackBlocksParameterObject | null {
  if (raw === false) return null;
  const a = args ?? {};
  const fromParam = coerce(raw, a);
  if (fromParam) return fromParam;
  if (!Array.isArray(a.blocks)) return null;
  return {
    blocks: a.blocks as Block[],
    ...(THEMES.has(a.theme as string) ? { theme: a.theme as SlackBlocksParameterObject['theme'] } : {}),
    ...(SURFACES.has(a.surface as string) ? { surface: a.surface as SlackBlocksParameterObject['surface'] } : {}),
    ...(a.width === 'full' || (typeof a.width === 'number' && a.width > 0)
      ? { width: a.width as SlackBlocksParameterObject['width'] }
      : {})
  };
}
