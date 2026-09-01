import { createElement as h, useMemo, useState } from 'react';
import { useArgs, useGlobals, useParameter } from 'storybook/manager-api';
import { buildBlockKitBuilderUrl } from './builder-url';
import { GLOBAL_SURFACE_KEY, PARAM_KEY } from './constants';
import { sanitizeBlockUrls } from './sanitize';
import type { SlackBlocksParameter, SlackBlocksParameterObject, SlackPreviewSurface } from './types';
import { validateForSurface } from './validate';

function coerce(
  param: SlackBlocksParameter | null,
  args: Record<string, unknown> | undefined
): SlackBlocksParameterObject | null {
  if (!param) return null;
  if (typeof param === 'function') {
    return coerce(param(args ?? {}), args);
  }
  if (Array.isArray(param)) return { blocks: param };
  return param;
}

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid var(--colors-border, #d9d9d9)',
  background: 'transparent',
  color: 'var(--colors-secondary, #555)',
  fontSize: 12,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block'
};

/**
 * Addon-panel content shown in the Storybook manager.
 *
 * **What the panel does**: validates the current story's `slackBlocks`
 * against `@tightknitai/slack-block-kit-validator`, lists any issues
 * field-by-field, and offers a Copy-JSON button + Block Kit Builder
 * deeplink so engineers can move the payload into adjacent tools.
 *
 * **What the panel does NOT do (v0 holdover)**: render the Slack preview
 * itself. The renderer depends on `slack-blocks-to-jsx`, which
 * transitively pulls in `emojilib` — a CJS module that the Storybook
 * manager-side esbuild bundle can't resolve cleanly. The decorator
 * (preview-side) does the real rendering inline. The validator has no
 * such dep so it works fine in the manager bundle.
 *
 * **Why this file uses `createElement` (`h`) directly instead of JSX**:
 * the Storybook 10 manager bundle externalizes `react` as `__REACT__` but
 * its esbuild emits classic `React.createElement(…)` calls without
 * `React` in scope, which crashes on mount. The published tsup build
 * uses the automatic JSX runtime so consumers never see this; only the
 * dogfood path (and any other consumer loading source through Storybook's
 * manager esbuild) hits it.
 *
 * See AGENTS.md → "Known risks → Manager-side rendering" for follow-up.
 */
export function Panel() {
  const raw = useParameter<SlackBlocksParameter | null>(PARAM_KEY, null);
  const [args] = useArgs();
  const [globals] = useGlobals();
  const surface = (globals[GLOBAL_SURFACE_KEY] as SlackPreviewSurface | undefined) ?? 'message';
  const [copied, setCopied] = useState(false);

  const normalized = useMemo(() => coerce(raw, args as Record<string, unknown> | undefined), [raw, args]);
  const effectiveSurface = normalized?.surface ?? surface;

  // Same allowlist the renderer applies, so the panel validates, copies
  // and deeplinks exactly the payload the preview drew.
  const { blocks, removed } = useMemo(
    () => (normalized ? sanitizeBlockUrls(normalized.blocks) : { blocks: [], removed: [] }),
    [normalized]
  );

  const validation = useMemo(() => {
    if (!normalized || normalized.validate === false) return null;
    return validateForSurface(blocks, effectiveSurface);
  }, [normalized, blocks, effectiveSurface]);

  if (!normalized) {
    return h(
      'div',
      { style: { padding: 16, fontFamily: 'inherit' } },
      h(
        'p',
        { style: { margin: 0 } },
        'Set ',
        h('code', null, `parameters.${PARAM_KEY}`),
        ' on a story to enable the Slack preview.'
      ),
      h(
        'pre',
        {
          style: {
            marginTop: 12,
            background: 'rgba(0, 0, 0, 0.04)',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.5
          }
        },
        `export const MyStory = {
  parameters: {
    slackBlocks: [
      { type: 'section', text: { type: 'mrkdwn', text: '*hi from Slack*' } }
    ]
  }
};`
      )
    );
  }

  const blockCount = blocks.length;

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

  const summary = h(
    'div',
    {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }
    },
    h(
      'p',
      { style: { margin: 0 } },
      'Story declares ',
      h('strong', null, blockCount),
      ` Slack ${blockCount === 1 ? 'block' : 'blocks'} on the `,
      h('code', null, effectiveSurface),
      ' surface. Preview renders inline below the story body.'
    ),
    h(
      'div',
      { style: { display: 'flex', gap: 6 } },
      h(
        'button',
        {
          type: 'button',
          onClick: onCopy,
          style: btnStyle,
          'aria-label': 'Copy blocks JSON to clipboard'
        },
        copied ? 'Copied ✓' : 'Copy JSON'
      ),
      h(
        'a',
        {
          href: buildBlockKitBuilderUrl(blocks, effectiveSurface),
          target: '_blank',
          rel: 'noopener noreferrer',
          style: btnStyle
        },
        'Open in Block Kit Builder ↗'
      )
    )
  );

  const validationNode = validation
    ? h(
        'div',
        { style: { marginTop: 12 } },
        validation.valid
          ? h(
              'div',
              {
                style: {
                  padding: '8px 12px',
                  fontSize: 13,
                  color: '#0a6c2d',
                  background: '#e6f6ec',
                  border: '1px solid #b6e2c4',
                  borderRadius: 4
                }
              },
              '✓ Valid Block Kit payload for the ',
              h('code', null, effectiveSurface),
              ' surface'
            )
          : h(
              'div',
              {
                style: {
                  padding: '8px 12px',
                  fontSize: 13,
                  color: '#8a1a14',
                  background: '#fdecea',
                  border: '1px solid #f3b8b1',
                  borderRadius: 4
                }
              },
              h(
                'div',
                { style: { fontWeight: 600, marginBottom: 6 } },
                `✗ ${validation.errors.length} validation ${validation.errors.length === 1 ? 'issue' : 'issues'}`
              ),
              h(
                'ul',
                { style: { margin: 0, paddingLeft: 20 } },
                validation.errors.map((err) =>
                  h(
                    'li',
                    { key: err, style: { marginTop: 2 } },
                    h(
                      'code',
                      {
                        style: { background: 'rgba(0,0,0,0.05)', padding: '0 4px', borderRadius: 3 }
                      },
                      err
                    )
                  )
                )
              )
            )
      )
    : null;

  const unsafeUrlNode =
    removed.length > 0
      ? h(
          'div',
          {
            style: {
              marginTop: 12,
              padding: '8px 12px',
              fontSize: 13,
              color: '#7a4a00',
              background: '#fff6e5',
              border: '1px solid #f0d9a8',
              borderRadius: 4
            }
          },
          h(
            'div',
            { style: { fontWeight: 600, marginBottom: 6 } },
            `⚠ ${removed.length} unsafe ${removed.length === 1 ? 'URL' : 'URLs'} removed before render — only http, https and mailto render`
          ),
          h(
            'ul',
            { style: { margin: 0, paddingLeft: 20 } },
            removed.map((url, idx) =>
              h(
                'li',
                { key: `${url}-${idx}`, style: { marginTop: 2 } },
                h('code', { style: { background: 'rgba(0,0,0,0.05)', padding: '0 4px', borderRadius: 3 } }, url)
              )
            )
          )
        )
      : null;

  const disabledNote =
    normalized.validate === false
      ? h(
          'p',
          { style: { marginTop: 12, fontSize: 12, color: 'var(--colors-secondary, #777)' } },
          'Validation disabled for this story (',
          h('code', null, 'validate: false'),
          ').'
        )
      : null;

  return h(
    'div',
    { style: { padding: 16, fontFamily: 'inherit' } },
    summary,
    validationNode,
    unsafeUrlNode,
    disabledNote
  );
}
