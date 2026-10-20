import { createElement as h, useMemo, useState } from 'react';
import { useArgs, useChannel, useGlobals, useParameter } from 'storybook/manager-api';
import { buildBlockKitBuilderUrl } from './builder-url';
import { EVENT_SIMULATE, GLOBAL_SURFACE_KEY, PARAM_KEY } from './constants';
import { SURFACE_LABELS } from './envelope';
import { extractInteractions } from './interactions';
import { resolveParameter } from './resolve';
import { sanitizeBlockUrls } from './sanitize';
import type { SlackBlocksParameter, SlackInteractionPayload, SlackPreviewSurface } from './types';
import { validateForSurface } from './validate';

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

const codeStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.05)', padding: '0 4px', borderRadius: 3 };

function errorList(errors: string[]) {
  return h(
    'ul',
    { style: { margin: 0, paddingLeft: 20 } },
    errors.map((err) => h('li', { key: err, style: { marginTop: 2 } }, h('code', { style: codeStyle }, err)))
  );
}

/**
 * The current story's payload as the panel sees it: resolved the same way
 * the preview decorator resolves it (`./resolve`), sanitized the same way
 * the renderer sanitizes it, and validated for the surface it's drawn on.
 * Shared by the panel body and its tab title.
 */
function useSlackStory() {
  const raw = useParameter<SlackBlocksParameter | null>(PARAM_KEY, null);
  const [args] = useArgs();
  const [globals] = useGlobals();
  const normalized = useMemo(() => resolveParameter(raw, args as Record<string, unknown> | undefined), [raw, args]);
  const surface: SlackPreviewSurface =
    normalized?.surface ?? (globals[GLOBAL_SURFACE_KEY] as SlackPreviewSurface | undefined) ?? 'message';

  const { blocks, removed } = useMemo(
    () => (normalized ? sanitizeBlockUrls(normalized.blocks) : { blocks: [], removed: [] }),
    [normalized]
  );
  const validation = useMemo(() => {
    if (!normalized || normalized.validate === false) return null;
    return validateForSurface(blocks, surface, normalized.modal);
  }, [normalized, blocks, surface]);
  const interactions = useMemo(() => extractInteractions(blocks), [blocks]);

  return { normalized, surface, blocks, removed, validation, interactions };
}

/**
 * Panel tab title. Carries the validation verdict so a broken payload is
 * visible without opening the panel — the canvas itself stays clean.
 */
export function PanelTitle() {
  const { normalized, validation } = useSlackStory();
  const issues = validation?.valid === false ? validation.errors.length : 0;
  if (!normalized || issues === 0) return h('span', null, 'Slack Block Kit');
  return h(
    'span',
    null,
    'Slack Block Kit ',
    h(
      'span',
      {
        style: {
          marginLeft: 4,
          padding: '0 6px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          color: '#fff',
          background: '#d1242f'
        },
        'aria-label': `${issues} validation ${issues === 1 ? 'issue' : 'issues'}`
      },
      issues
    )
  );
}

/**
 * Addon-panel content shown in the Storybook manager. Everything about the
 * payload that isn't the Slack UI itself lives here, so the canvas can be
 * just the rendered surface:
 *
 *  - Copy JSON + Block Kit Builder deeplink
 *  - the validation report from `@tightknitai/slack-block-kit-validator`
 *  - URLs the sanitizer stripped
 *  - every interactive element, each with a "Simulate" button that sends
 *    the payload to the preview (`EVENT_SIMULATE`), where the decorator
 *    calls the story's `onInteraction` and logs it to the Actions panel
 *
 * **What the panel does NOT do**: render the Slack preview itself. The
 * renderer depends on `slack-blocks-to-jsx`, which transitively pulls in
 * `emojilib` — a CJS module that the Storybook manager-side esbuild bundle
 * can't resolve cleanly. The validator has no such dep so it works fine in
 * the manager bundle.
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
  const { normalized, surface: effectiveSurface, blocks, removed, validation, interactions } = useSlackStory();
  const [copied, setCopied] = useState(false);
  const [firedIdx, setFiredIdx] = useState<number | null>(null);
  const emit = useChannel({});

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
      ' surface.'
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
          href: buildBlockKitBuilderUrl(blocks, effectiveSurface, normalized.modal),
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
                `✗ ${validation.errors.length} validation ${validation.errors.length === 1 ? 'issue' : 'issues'} for the `,
                h('code', null, effectiveSurface),
                ' surface'
              ),
              // Surface findings get their own group: the canvas still draws
              // those blocks, so this is the only place that says Slack won't.
              validation.surfaceErrors.length > 0
                ? h(
                    'div',
                    { style: { marginBottom: validation.otherErrors.length > 0 ? 8 : 0 } },
                    h(
                      'div',
                      { style: { fontWeight: 600, marginBottom: 4 } },
                      `Won't render on ${SURFACE_LABELS[effectiveSurface]} — the preview still draws these, Slack won't`
                    ),
                    errorList(validation.surfaceErrors)
                  )
                : null,
              validation.otherErrors.length > 0
                ? h(
                    'div',
                    null,
                    validation.surfaceErrors.length > 0
                      ? h('div', { style: { fontWeight: 600, marginBottom: 4 } }, 'Other issues')
                      : null,
                    errorList(validation.otherErrors)
                  )
                : null
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
              h('li', { key: `${url}-${idx}`, style: { marginTop: 2 } }, h('code', { style: codeStyle }, url))
            )
          )
        )
      : null;

  const simulate = (payload: SlackInteractionPayload, idx: number) => () => {
    emit(EVENT_SIMULATE, payload);
    setFiredIdx(idx);
    setTimeout(() => setFiredIdx((current) => (current === idx ? null : current)), 1500);
  };

  const interactionsNode =
    interactions.length > 0
      ? h(
          'div',
          { style: { marginTop: 16 } },
          h('div', { style: { fontWeight: 600, marginBottom: 4 } }, `Interactions (${interactions.length})`),
          h(
            'p',
            { style: { margin: '0 0 8px', fontSize: 12, color: 'var(--colors-secondary, #777)' } },
            'Click a button in the preview, or simulate any element here. Payloads go to ',
            h('code', null, 'onInteraction'),
            ' and the Actions panel.'
          ),
          h(
            'ul',
            { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 } },
            interactions.map((i, idx) =>
              h(
                'li',
                {
                  key: `${i.action_id ?? 'noid'}-${idx}`,
                  style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }
                },
                h(
                  'code',
                  { style: { fontSize: 12 } },
                  i.type,
                  i.action_id ? ` · action_id="${i.action_id}"` : '',
                  i.value ? ` · value="${i.value}"` : '',
                  i.label ? ` · "${i.label}"` : ''
                ),
                h(
                  'button',
                  { type: 'button', onClick: simulate(i, idx), style: btnStyle, 'aria-live': 'polite' },
                  firedIdx === idx ? 'Fired ✓' : 'Simulate'
                )
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
    interactionsNode,
    disabledNote
  );
}
