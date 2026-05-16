import { useParameter } from 'storybook/manager-api';
import { PARAM_KEY } from './constants';
import type { SlackBlocksParameter } from './types';

/**
 * Addon-panel content shown in the Storybook manager.
 *
 * **v0 limitation**: this panel intentionally does NOT render the Slack
 * preview itself. The renderer depends on `slack-blocks-to-jsx`, which
 * transitively pulls in `emojilib` — a CJS module that the Storybook
 * manager-side esbuild bundle can't resolve cleanly. Until that's fixed
 * (either by patching emojilib upstream or wrapping the panel in an
 * iframe that loads a hidden preview story), the panel reports the
 * preview is rendered inline by the decorator.
 *
 * The decorator (preview-side) is the active feature for v0. Set
 * `parameters.slackBlocks` on a story and the preview appears below it.
 *
 * See AGENTS.md → "Known risks → Manager-side rendering" for the
 * follow-up plan.
 */
export function Panel() {
  const raw = useParameter<SlackBlocksParameter | null>(PARAM_KEY, null);

  if (!raw) {
    return (
      <div style={{ padding: 16, fontFamily: 'inherit' }}>
        <p style={{ margin: 0 }}>
          Set <code>parameters.{PARAM_KEY}</code> on a story to enable the Slack preview.
        </p>
        <pre
          style={{
            marginTop: 12,
            background: 'rgba(0, 0, 0, 0.04)',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.5
          }}
        >
{`export const MyStory = {
  parameters: {
    slackBlocks: [
      { type: 'section', text: { type: 'mrkdwn', text: '*hi from Slack*' } }
    ]
  }
};`}
        </pre>
      </div>
    );
  }

  const blockCount = Array.isArray(raw) ? raw.length : raw.blocks.length;

  return (
    <div style={{ padding: 16, fontFamily: 'inherit' }}>
      <p style={{ margin: 0 }}>
        Story declares <strong>{blockCount}</strong> Slack {blockCount === 1 ? 'block' : 'blocks'}.
        The preview is rendered inline by the decorator (below the story body).
      </p>
      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--colors-secondary, #555)' }}>
        Toolbar globals <code>Slack theme</code> and <code>Slack surface</code> flip the inline
        preview live.
      </p>
    </div>
  );
}
