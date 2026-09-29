import type { Block } from 'slack-blocks-to-jsx';

/**
 * Block types `slack-blocks-to-jsx` draws itself. Anything else is either
 * translated below (`data_table`) or swapped for a visible placeholder —
 * the library renders nothing at all for a type it doesn't know, which
 * reads as "this block is fine and empty" rather than "the preview can't
 * draw this".
 */
const RENDERED_TYPES = new Set([
  'actions',
  'alert',
  'card',
  'carousel',
  'container',
  'context',
  'context_actions',
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
]);

// Slack's own default when `page_size` is omitted.
const DEFAULT_PAGE_SIZE = 5;

type AnyBlock = Record<string, unknown>;

function context(text: string): AnyBlock {
  return { type: 'context', elements: [{ type: 'mrkdwn', text }] };
}

/**
 * `data_table` → the library's `table` block, showing the first page the
 * way Slack does, with the caption above and a row count below. Slack's
 * sort / filter / pager controls aren't reproduced — the layout and cell
 * contents are.
 */
function dataTableToTable(block: AnyBlock): AnyBlock[] {
  const rows = Array.isArray(block.rows) ? (block.rows as unknown[][]) : [];
  const [header, ...data] = rows;
  const pageSize =
    typeof block.page_size === 'number' && block.page_size > 0 ? Math.floor(block.page_size) : DEFAULT_PAGE_SIZE;
  const page = data.slice(0, pageSize);

  // `raw_number` carries a display `text` next to the numeric `value`; the
  // library's table only knows `raw_text`, so show the display string.
  const toCell = (cell: unknown): unknown => {
    const c = cell as AnyBlock | null;
    if (c?.type !== 'raw_number') return cell;
    return { type: 'raw_text', text: typeof c.text === 'string' ? c.text : String(c.value ?? '') };
  };

  // Right-align columns that are numeric all the way down, like Slack does.
  const width = Math.max(0, ...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
  const column_settings = Array.from({ length: width }, (_, i) => ({
    align:
      data.length > 0 && data.every((r) => (r?.[i] as AnyBlock | undefined)?.type === 'raw_number') ? 'right' : 'left'
  }));

  const out: AnyBlock[] = [];
  if (typeof block.caption === 'string' && block.caption) out.push(context(`*${block.caption}*`));
  out.push({
    type: 'table',
    ...(typeof block.block_id === 'string' ? { block_id: block.block_id } : {}),
    column_settings,
    rows: (header ? [header, ...page] : page).map((r) => (Array.isArray(r) ? r.map(toCell) : r))
  });
  if (data.length > pageSize) out.push(context(`Showing 1–${page.length} of ${data.length} rows`));
  return out;
}

function normalizeList(blocks: AnyBlock[]): AnyBlock[] {
  return blocks.flatMap((block): AnyBlock[] => {
    if (!block || typeof block !== 'object') return [block];
    if (block.type === 'data_table') return dataTableToTable(block);
    if (block.type === 'container' && Array.isArray(block.child_blocks)) {
      return [{ ...block, child_blocks: normalizeList(block.child_blocks as AnyBlock[]) }];
    }
    if (typeof block.type === 'string' && !RENDERED_TYPES.has(block.type)) {
      return [context(`:warning: Unsupported block \`${block.type}\` — the preview can't draw it.`)];
    }
    return [block];
  });
}

/**
 * Render-time adapter between the payload a story hands in and what
 * `slack-blocks-to-jsx` can draw. Only the render sees the result:
 * validation, Copy JSON, the Builder link and the interaction simulator
 * all keep working off the payload as written.
 */
export function normalizeForRender(blocks: Block[]): Block[] {
  return normalizeList(blocks as unknown as AnyBlock[]) as unknown as Block[];
}
