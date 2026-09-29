import { renderToStaticMarkup } from 'react-dom/server';
import type { Block } from 'slack-blocks-to-jsx';
import { describe, expect, it } from 'vitest';
import { extractInteractions } from '../src/interactions';
import { normalizeForRender } from '../src/normalize';
import { Renderer } from '../src/renderer';
import type { SlackPreviewSurface } from '../src/types';
import { validateForSurface } from '../src/validate';
import * as catalog from '../stories/Blocks.stories';

/**
 * Every block in Slack's reference, https://docs.slack.dev/reference/block-kit/blocks.
 * When Slack adds one, add it here and a story to `stories/Blocks.stories.tsx`.
 */
const SLACK_BLOCK_TYPES = [
  'actions',
  'alert',
  'card',
  'carousel',
  'container',
  'context',
  'context_actions',
  'data_table',
  'data_visualization',
  'divider',
  'file',
  'header',
  'image',
  'input',
  'markdown',
  'plan',
  'rich_text',
  'section',
  'table',
  'task_card',
  'video'
];

// Apps can't send `file` blocks — Slack only includes them on retrieved
// messages — so there's nothing for the preview to draw or validate.
const NOT_SENDABLE = new Set(['File']);

interface CatalogStory {
  args?: { blocks?: Block[]; surface?: SlackPreviewSurface };
}

const stories = Object.entries(catalog as Record<string, CatalogStory>).filter(
  ([name, story]) => name !== 'default' && Array.isArray(story.args?.blocks)
);

/** Visible text of the rendered markup, tags stripped. */
function textOf(blocks: unknown[], surface: SlackPreviewSurface = 'message'): string {
  const html = renderToStaticMarkup(
    <Renderer blocks={blocks as Block[]} surface={surface} validate={false} logo="https://example.com/a.png" />
  );
  // Drop the envelope / modal chrome so only block output is left.
  const body = html.slice(html.indexOf('id="slack_blocks_to_jsx"'));
  return body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('block catalog', () => {
  it('has a story for every block type in Slack’s reference', () => {
    const covered = new Set(stories.flatMap(([, story]) => (story.args?.blocks ?? []).map((b) => b.type as string)));
    expect(SLACK_BLOCK_TYPES.filter((type) => !covered.has(type))).toEqual([]);
  });

  it.each(stories.filter(([name]) => !NOT_SENDABLE.has(name)))('%s validates on its surface', (_name, story) => {
    const result = validateForSurface(story.args?.blocks ?? [], story.args?.surface ?? 'message');
    expect(result.errors).toEqual([]);
  });

  it.each(stories)('%s renders visible content', (_name, story) => {
    expect(textOf(story.args?.blocks ?? [], story.args?.surface).length).toBeGreaterThan(0);
  });
});

describe('data_table', () => {
  const row = (name: string, n: number) => [
    { type: 'raw_text', text: name },
    { type: 'raw_number', value: n, text: n.toLocaleString('en-US') }
  ];
  const table = {
    type: 'data_table',
    caption: 'Members',
    page_size: 2,
    rows: [
      [
        { type: 'raw_text', text: 'Name' },
        { type: 'raw_text', text: 'Posts' }
      ],
      row('Ann', 1200),
      row('Ben', 3),
      row('Cy', 9)
    ]
  };

  it('draws the first page with its caption and a row count', () => {
    const text = textOf([table]);
    expect(text).toContain('Members');
    expect(text).toContain('Ann 1,200');
    expect(text).toContain('Ben 3');
    expect(text).not.toContain('Cy');
    expect(text).toContain('Showing 1–2 of 3 rows');
  });

  it('right-aligns all-number columns and defaults to five rows per page', () => {
    const [drawn] = normalizeForRender([{ ...table, caption: '', page_size: undefined }] as unknown as Block[]);
    const t = drawn as unknown as { column_settings: { align: string }[]; rows: unknown[] };
    expect(t.column_settings.map((c) => c.align)).toEqual(['left', 'right']);
    expect(t.rows).toHaveLength(4);
  });

  it('is translated inside containers too', () => {
    const text = textOf([{ type: 'container', title: { type: 'plain_text', text: 'Box' }, child_blocks: [table] }]);
    expect(text).toContain('Ann 1,200');
  });
});

it('shows a placeholder for block types the preview can’t draw', () => {
  expect(textOf([{ type: 'made_up_block' }])).toContain('Unsupported block made_up_block');
});

it('finds interactive elements nested in containers, cards and carousels', () => {
  const button = (action_id: string) => ({ type: 'button', text: { type: 'plain_text', text: action_id }, action_id });
  const ids = extractInteractions([
    {
      type: 'container',
      title: { type: 'plain_text', text: 'Box' },
      child_blocks: [{ type: 'actions', elements: [button('in_container')] }]
    },
    { type: 'card', title: { type: 'plain_text', text: 'Card' }, actions: [button('in_card')] },
    { type: 'carousel', elements: [{ type: 'card', actions: [button('in_carousel')] }] }
  ] as unknown as Block[]).map((i) => i.action_id);
  expect(ids).toEqual(['in_container', 'in_card', 'in_carousel']);
});
