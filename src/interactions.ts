import type { Block } from 'slack-blocks-to-jsx';
import type { SlackInteractionPayload } from './types';

/**
 * Element `type` values that fire an interaction payload when a user
 * touches them in Slack. Sourced from
 * <https://docs.slack.dev/reference/block-kit/block-elements/>.
 *
 * Pure data inputs (`plain_text_input`, `email_text_input`,
 * `url_text_input`, `number_input`) are intentionally omitted — they only
 * fire on `dispatch_action`, and the simulator can't usefully synthesize
 * a free-text value. Same reasoning for `file_input`.
 */
const INTERACTIVE_TYPES = new Set([
  'button',
  'workflow_button',
  'static_select',
  'multi_static_select',
  'users_select',
  'multi_users_select',
  'conversations_select',
  'multi_conversations_select',
  'channels_select',
  'multi_channels_select',
  'external_select',
  'multi_external_select',
  'overflow',
  'datepicker',
  'datetimepicker',
  'timepicker',
  'checkboxes',
  'radio_buttons'
]);

interface ElementLike {
  type?: unknown;
  action_id?: unknown;
  value?: unknown;
  text?: { text?: unknown } | unknown;
  placeholder?: { text?: unknown };
}

function labelOf(el: ElementLike): string | undefined {
  const text = (el.text ?? null) as { text?: unknown } | null;
  if (text && typeof text === 'object' && typeof text.text === 'string') return text.text;
  const placeholder = (el.placeholder ?? null) as { text?: unknown } | null;
  if (placeholder && typeof placeholder.text === 'string') return placeholder.text;
  return undefined;
}

function pushFrom(block: Record<string, unknown>, el: ElementLike, out: SlackInteractionPayload[]): void {
  if (typeof el.type !== 'string' || !INTERACTIVE_TYPES.has(el.type)) return;
  out.push({
    type: el.type,
    action_id: typeof el.action_id === 'string' ? el.action_id : undefined,
    block_id: typeof block.block_id === 'string' ? block.block_id : undefined,
    value: typeof el.value === 'string' ? el.value : undefined,
    label: labelOf(el)
  });
}

/**
 * Walks a Block Kit payload and returns one entry per interactive element
 * (button, select, datepicker, overflow, etc.). Used by the renderer to
 * build an "Interactions" simulator below the preview so consumers can
 * verify their handler payloads without round-tripping through a real
 * Slack workspace.
 */
export function extractInteractions(blocks: Block[]): SlackInteractionPayload[] {
  const out: SlackInteractionPayload[] = [];
  for (const block of blocks as Array<Record<string, unknown>>) {
    if (block.type === 'actions' && Array.isArray(block.elements)) {
      for (const el of block.elements as ElementLike[]) pushFrom(block, el, out);
    }
    if (block.type === 'section' && block.accessory) {
      pushFrom(block, block.accessory as ElementLike, out);
    }
    if (block.type === 'input' && block.element) {
      pushFrom(block, block.element as ElementLike, out);
    }
    if (block.type === 'context_actions' && Array.isArray(block.elements)) {
      for (const el of block.elements as ElementLike[]) pushFrom(block, el, out);
    }
  }
  return out;
}
