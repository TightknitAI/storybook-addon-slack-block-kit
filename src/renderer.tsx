import 'slack-blocks-to-jsx/dist/style.css';

import { type Block, Message } from 'slack-blocks-to-jsx';
import type { SlackPreviewHooks, SlackPreviewSurface, SlackPreviewTheme } from './types';

export interface RendererProps {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
}

const COLORS = {
  light: {
    bg: '#ffffff',
    text: '#1d1c1d',
    border: '#e8e8e8',
    muted: '#616061',
    accent: '#1264a3',
    activeBorder: '#1264a3'
  },
  dark: {
    bg: '#1a1d21',
    text: '#d1d2d3',
    border: '#2c2d30',
    muted: '#9aa0a6',
    accent: '#1d9bd1',
    activeBorder: '#1d9bd1'
  }
} as const;

/**
 * Renders an array of Slack Block Kit blocks the way Slack would, via
 * `slack-blocks-to-jsx`'s `<Message>`. The `surface` prop wraps the
 * message in a thin chrome that approximates Slack's modal / app-home
 * surfaces. The `#slack_blocks_to_jsx` id + `data-theme` attribute are
 * load-bearing for the upstream CSS scope; do not remove.
 */
export function Renderer({ blocks, theme = 'light', surface = 'message', hooks }: RendererProps) {
  const c = COLORS[theme];

  const message = (
    <div id="slack_blocks_to_jsx" data-theme={theme} className="slack_blocks_to_jsx styles_enabled">
      <Message
        time={new Date()}
        name=""
        logo=""
        withoutWrapper
        theme={theme}
        blocks={blocks}
        hooks={hooks as Record<string, unknown> | undefined}
      />
    </div>
  );

  if (surface === 'modal') {
    return (
      <div
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          maxWidth: 600,
          fontFamily:
            "Lato, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${c.border}`,
            fontWeight: 700,
            fontSize: 15
          }}
        >
          Modal title
        </div>
        <div style={{ padding: 16 }}>{message}</div>
        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: `1px solid ${c.border}`,
              background: 'transparent',
              color: c.text,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: c.accent,
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  if (surface === 'app_home') {
    return (
      <div
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          maxWidth: 720,
          fontFamily:
            "Lato, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            gap: 20,
            fontSize: 13
          }}
        >
          <span
            style={{ fontWeight: 700, borderBottom: `2px solid ${c.activeBorder}`, paddingBottom: 8 }}
          >
            Home
          </span>
          <span style={{ color: c.muted, paddingBottom: 8 }}>Messages</span>
          <span style={{ color: c.muted, paddingBottom: 8 }}>About</span>
        </div>
        <div style={{ padding: 16 }}>{message}</div>
      </div>
    );
  }

  // message surface: bare blocks in a Slack-y card.
  return (
    <div
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: 16,
        maxWidth: 600,
        fontFamily: "Lato, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {message}
    </div>
  );
}
