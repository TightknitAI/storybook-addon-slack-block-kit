import type { ValidationResult } from '@tightknitai/slack-block-kit-validator';
import { useState } from 'react';
import type { Block } from 'slack-blocks-to-jsx';
import { buildBlockKitBuilderUrl } from './builder-url';
import type { SlackInteractionPayload, SlackPreviewSurface } from './types';

interface ChromeColors {
  bg: string;
  text: string;
  border: string;
  muted: string;
  accent: string;
}

interface ChromeTextStyle {
  fontFamily: string;
}

interface ToolbarProps {
  blocks: Block[];
  surface: SlackPreviewSurface;
  colors: ChromeColors;
  fontFamily: string;
}

/**
 * The top-right toolbar shown above every preview: "Copy JSON" + "Open in
 * Block Kit Builder". Designed to be flat and unobtrusive so it doesn't
 * compete with the rendered Slack chrome.
 */
export function PreviewToolbar({ blocks, surface, colors, fontFamily }: ToolbarProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    void navigator.clipboard
      .writeText(JSON.stringify(blocks, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setCopied(false);
      });
  };

  const builderHref = buildBlockKitBuilderUrl(blocks, surface);

  const btn = {
    padding: '4px 10px',
    borderRadius: 4,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    cursor: 'pointer'
  } as const;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 6 }}>
      <button type="button" onClick={onCopy} style={btn} aria-label="Copy blocks JSON to clipboard">
        {copied ? 'Copied ✓' : 'Copy JSON'}
      </button>
      <a
        href={builderHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}
      >
        Open in Block Kit Builder ↗
      </a>
    </div>
  );
}

interface ValidationBannerProps {
  result: ValidationResult;
  colors: ChromeColors;
  fontFamily: string;
}

/**
 * Inline validation banner. Shows above the preview when the validator
 * returns issues. Green when valid; red when not. Wrapping `<details>`
 * keeps the surface area small until the consumer wants to dig in.
 */
export function ValidationBanner({ result, colors: _colors, fontFamily }: ValidationBannerProps) {
  if (result.valid) {
    return (
      <div
        style={{
          marginBottom: 6,
          padding: '6px 10px',
          fontSize: 12,
          fontFamily,
          color: '#0a6c2d',
          background: '#e6f6ec',
          border: '1px solid #b6e2c4',
          borderRadius: 4
        }}
      >
        ✓ Valid Block Kit payload
      </div>
    );
  }

  return (
    <details
      style={{
        marginBottom: 6,
        padding: '6px 10px',
        fontSize: 12,
        fontFamily,
        color: '#8a1a14',
        background: '#fdecea',
        border: '1px solid #f3b8b1',
        borderRadius: 4
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
        ✗ {result.errors.length} validation {result.errors.length === 1 ? 'issue' : 'issues'}
      </summary>
      <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
        {result.errors.map((err) => (
          <li key={err} style={{ marginTop: 2 }}>
            <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0 4px', borderRadius: 3 }}>{err}</code>
          </li>
        ))}
      </ul>
    </details>
  );
}

interface UnsafeUrlNoticeProps {
  removed: string[];
  fontFamily: string;
}

/**
 * Shown when the renderer stripped a URL whose scheme isn't on the
 * allowlist (see `../sanitize`). Without it the preview would quietly
 * differ from the payload the story declared — a dead link or a missing
 * image with no explanation.
 */
export function UnsafeUrlNotice({ removed, fontFamily }: UnsafeUrlNoticeProps) {
  if (removed.length === 0) return null;

  return (
    <details
      style={{
        marginBottom: 6,
        padding: '6px 10px',
        fontSize: 12,
        fontFamily,
        color: '#7a4a00',
        background: '#fff6e5',
        border: '1px solid #f0d9a8',
        borderRadius: 4
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
        ⚠ {removed.length} unsafe {removed.length === 1 ? 'URL' : 'URLs'} removed — only http, https and mailto render
      </summary>
      <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
        {removed.map((url, idx) => (
          <li key={`${url}-${idx}`} style={{ marginTop: 2 }}>
            <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0 4px', borderRadius: 3 }}>{url}</code>
          </li>
        ))}
      </ul>
    </details>
  );
}

interface InteractionsProps {
  interactions: SlackInteractionPayload[];
  onInteraction?: (payload: SlackInteractionPayload) => void;
  colors: ChromeColors;
  fontFamily: string;
}

/**
 * Lists every interactive element discovered in the blocks and lets the
 * user "Simulate" a click on each one. The simulator fires the consumer's
 * `onInteraction` callback (typically set on `parameters.slackBlocks`) and
 * logs to the console as a fallback — useful in workshops/demos.
 *
 * This is the addon's substitute for real Slack interactivity, which
 * `slack-blocks-to-jsx` does not implement (it's a pure renderer).
 */
export function InteractionsPanel({ interactions, onInteraction, colors, fontFamily }: InteractionsProps) {
  const [firedIdx, setFiredIdx] = useState<number | null>(null);

  if (interactions.length === 0) return null;

  const onClick = (p: SlackInteractionPayload, idx: number) => () => {
    try {
      onInteraction?.(p);
    } finally {
      // Console log mirrors Slack's webhook payload shape closely enough
      // that consumers can copy/paste into a real handler test.
      // eslint-disable-next-line no-console
      console.log('[slack-block-kit] interaction', p);
      setFiredIdx(idx);
      setTimeout(() => {
        setFiredIdx((current) => (current === idx ? null : current));
      }, 1500);
    }
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: 10,
        border: `1px dashed ${colors.border}`,
        borderRadius: 6,
        fontFamily,
        fontSize: 12,
        color: colors.muted
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: colors.text }}>Interactions</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
        {interactions.map((i, idx) => {
          const fired = firedIdx === idx;
          return (
            <li
              key={`${i.action_id ?? 'noid'}-${idx}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
            >
              <code style={{ color: colors.text }}>
                {i.type}
                {i.action_id ? ` · action_id="${i.action_id}"` : ''}
                {i.value ? ` · value="${i.value}"` : ''}
                {i.label ? ` · "${i.label}"` : ''}
              </code>
              <button
                type="button"
                onClick={onClick(i, idx)}
                aria-live="polite"
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: `1px solid ${fired ? '#b6e2c4' : colors.border}`,
                  background: fired ? '#e6f6ec' : 'transparent',
                  color: fired ? '#0a6c2d' : colors.accent,
                  cursor: 'pointer',
                  fontFamily,
                  fontSize: 12,
                  transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease'
                }}
              >
                {fired ? 'Fired ✓' : 'Simulate'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type { ChromeColors, ChromeTextStyle };
