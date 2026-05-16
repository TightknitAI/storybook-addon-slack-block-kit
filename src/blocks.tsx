import { Renderer } from './renderer';
import type { SlackPreviewProps } from './types';

/**
 * MDX-friendly doc block. Drop into a `*.mdx` story page to embed a live
 * Slack-style preview of a Block Kit JSON payload.
 *
 * ```mdx
 * import { SlackPreview } from '@tightknitai/storybook-addon-slack-block-kit';
 *
 * <SlackPreview blocks={[{ type: 'section', text: { type: 'mrkdwn', text: '*hi*' } }]} />
 * ```
 */
export function SlackPreview(props: SlackPreviewProps) {
  return <Renderer {...props} />;
}
