import 'slack-blocks-to-jsx/dist/style.css';

import { type Block, Message } from 'slack-blocks-to-jsx';
import type { SlackPreviewHooks, SlackPreviewSurface, SlackPreviewTheme } from './types';

export interface RendererProps {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
  /** App name shown in the message envelope. Defaults to "Storybook App". */
  name?: string;
  /** Avatar URL shown in the message envelope. Defaults to an inline SVG. */
  logo?: string;
}

const COLORS = {
  light: {
    bg: '#ffffff',
    text: '#1d1c1d',
    border: '#e8e8e8',
    muted: '#616061',
    accent: '#1264a3'
  },
  dark: {
    bg: '#1a1d21',
    text: '#d1d2d3',
    border: '#2c2d30',
    muted: '#9aa0a6',
    accent: '#1d9bd1'
  }
} as const;

const FONT_STACK = "Lato, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const DEFAULT_NAME = 'Storybook App';

// Inline Slack-aubergine avatar so the message envelope renders cleanly
// without a network fetch.
const DEFAULT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" rx="6" fill="#4A154B"/><text x="50%" y="56%" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">S</text></svg>'
)}`;

/**
 * Renders an array of Slack Block Kit blocks the way Slack would, via
 * `slack-blocks-to-jsx`'s `<Message>`. Blocks always render inside a
 * realistic Slack surface (message envelope or modal chrome) so consumers
 * can see what their payload will look like in context. The
 * `#slack_blocks_to_jsx` id + `data-theme` attribute are load-bearing for
 * the upstream CSS scope; do not remove.
 */
export function Renderer({
  blocks,
  theme = 'light',
  surface = 'message',
  hooks,
  name = DEFAULT_NAME,
  logo = DEFAULT_LOGO
}: RendererProps) {
  const c = COLORS[theme];

  if (surface === 'modal') {
    // Modals in Slack don't carry a message envelope (no avatar / app
    // name / timestamp), so render the blocks bare inside the modal body.
    return (
      <div
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          maxWidth: 600,
          fontFamily: FONT_STACK
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
        <div style={{ padding: 16 }}>
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
        </div>
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

  // Default: `message` surface — render blocks inside the full Slack
  // message envelope (avatar + app name + timestamp header) so the
  // preview matches how a posted message will look in a channel.
  return (
    <div
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: 16,
        maxWidth: 600,
        fontFamily: FONT_STACK
      }}
    >
      <div id="slack_blocks_to_jsx" data-theme={theme} className="slack_blocks_to_jsx styles_enabled">
        <Message
          time={new Date()}
          name={name}
          logo={logo}
          theme={theme}
          blocks={blocks}
          hooks={hooks as Record<string, unknown> | undefined}
        />
      </div>
    </div>
  );
}
