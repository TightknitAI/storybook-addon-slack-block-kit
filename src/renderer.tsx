import 'slack-blocks-to-jsx/dist/style.css';

import { useMemo } from 'react';
import { type Block, Message } from 'slack-blocks-to-jsx';
import { extractInteractions } from './interactions';
import { InteractionsPanel, PreviewToolbar, ValidationBanner } from './preview-chrome';
import type { SlackInteractionPayload, SlackPreviewHooks, SlackPreviewSurface, SlackPreviewTheme } from './types';
import { validateForSurface } from './validate';

export interface RendererProps {
  blocks: Block[];
  theme?: SlackPreviewTheme;
  surface?: SlackPreviewSurface;
  hooks?: SlackPreviewHooks;
  /** App name shown in the message envelope. Defaults to "Storybook App". */
  name?: string;
  /** Avatar URL shown in the message envelope. Defaults to an inline SVG. */
  logo?: string;
  /** Show the inline validation banner. Defaults to `true`. */
  validate?: boolean;
  /** Fired when the user clicks "Simulate" on an interactive element. */
  onInteraction?: (payload: SlackInteractionPayload) => void;
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

interface SurfaceBodyProps {
  blocks: Block[];
  theme: SlackPreviewTheme;
  hooks?: SlackPreviewHooks;
}

/**
 * The actual Slack-rendered blocks, scoped under the
 * `#slack_blocks_to_jsx` id + `data-theme` attribute the upstream
 * library's CSS relies on. Used inside every surface variant below.
 */
function SurfaceBody({ blocks, theme, hooks }: SurfaceBodyProps) {
  return (
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
}

/**
 * Renders an array of Slack Block Kit blocks the way Slack would, via
 * `slack-blocks-to-jsx`'s `<Message>`. Blocks always render inside a
 * realistic Slack surface (message envelope, modal chrome, or App Home
 * tabs) so consumers can see what their payload will look like in
 * context. The `#slack_blocks_to_jsx` id + `data-theme` attribute are
 * load-bearing for the upstream CSS scope; do not remove.
 */
export function Renderer({
  blocks,
  theme = 'light',
  surface = 'message',
  hooks,
  name = DEFAULT_NAME,
  logo = DEFAULT_LOGO,
  validate = true,
  onInteraction
}: RendererProps) {
  const c = COLORS[theme];

  // Validation + interaction extraction are cheap but worth memoizing —
  // they run on every theme/surface toggle from the toolbar globals.
  const validation = useMemo(
    () => (validate ? validateForSurface(blocks, surface) : null),
    [blocks, surface, validate]
  );
  const interactions = useMemo(() => extractInteractions(blocks), [blocks]);

  const chrome = (body: React.ReactNode) => (
    <div style={{ fontFamily: FONT_STACK, maxWidth: 600 }}>
      <PreviewToolbar blocks={blocks} surface={surface} colors={c} fontFamily={FONT_STACK} />
      {validation ? <ValidationBanner result={validation} colors={c} fontFamily={FONT_STACK} /> : null}
      {body}
      <InteractionsPanel interactions={interactions} onInteraction={onInteraction} colors={c} fontFamily={FONT_STACK} />
    </div>
  );

  if (surface === 'modal') {
    // Modals in Slack don't carry a message envelope (no avatar / app
    // name / timestamp), so render the blocks bare inside the modal body.
    return chrome(
      <div
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          overflow: 'hidden'
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
          <SurfaceBody blocks={blocks} theme={theme} hooks={hooks} />
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

  if (surface === 'home') {
    // App Home tab chrome: tab strip across the top mimicking the
    // Home / Messages / About row a real Slack app shows. Blocks render
    // inside the active "Home" tab body.
    const tabBase = {
      padding: '8px 14px',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'default' as const,
      borderBottom: '2px solid transparent'
    };
    return chrome(
      <div
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '4px 12px 0',
            borderBottom: `1px solid ${c.border}`,
            background: theme === 'dark' ? '#222529' : '#f8f8f8'
          }}
        >
          <div style={{ ...tabBase, color: c.text, borderBottomColor: c.accent }}>Home</div>
          <div style={{ ...tabBase, color: c.muted }}>Messages</div>
          <div style={{ ...tabBase, color: c.muted }}>About</div>
        </div>
        <div style={{ padding: 16 }}>
          <SurfaceBody blocks={blocks} theme={theme} hooks={hooks} />
        </div>
      </div>
    );
  }

  // Default: `message` surface — render blocks inside the full Slack
  // message envelope (avatar + app name + timestamp header) so the
  // preview matches how a posted message will look in a channel.
  return chrome(
    <div
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: 16
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
