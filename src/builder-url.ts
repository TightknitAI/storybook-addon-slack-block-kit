import type { Block } from 'slack-blocks-to-jsx';
import type { SlackPreviewSurface } from './types';

/**
 * Builds a Block Kit Builder URL that opens the given blocks pre-filled.
 *
 * Slack's Block Kit Builder accepts a URL-encoded JSON payload after the
 * hash. Shape varies by surface:
 *
 *  - `message`: `{ "blocks": [...] }`
 *  - `modal`:   `{ "type": "modal", "title": { ... }, "blocks": [...] }`
 *  - `home`:    `{ "type": "home", "blocks": [...] }`
 *
 * The Builder's URL fragment is unauthenticated and ephemeral; the link
 * just round-trips the payload into Slack's hosted editor. No data leaves
 * the user's browser until they click.
 */
export function buildBlockKitBuilderUrl(blocks: Block[], surface: SlackPreviewSurface): string {
  const payload =
    surface === 'modal'
      ? { type: 'modal', title: { type: 'plain_text', text: 'Preview' }, blocks }
      : surface === 'home'
        ? { type: 'home', blocks }
        : { blocks };
  return `https://app.slack.com/block-kit-builder#${encodeURIComponent(JSON.stringify(payload))}`;
}
