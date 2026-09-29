import { renderToStaticMarkup } from 'react-dom/server';
import type { Block } from 'slack-blocks-to-jsx';
import { describe, expect, it } from 'vitest';
import { extractInteractions, matchClickedLabel } from '../src/interactions';
import { Renderer } from '../src/renderer';
import { resolveParameter } from '../src/resolve';
import type { SlackPreviewProps } from '../src/types';
import { validateForSurface } from '../src/validate';

const button = (text: string, action_id: string) => ({
  type: 'button',
  text: { type: 'plain_text', text },
  action_id
});

const blocks = [
  { type: 'section', text: { type: 'mrkdwn', text: 'Deploy?' } },
  { type: 'actions', elements: [button('Approve', 'approve'), button('Reject', 'reject')] }
] as unknown as Block[];

function render(props: Partial<SlackPreviewProps> = {}): string {
  return renderToStaticMarkup(<Renderer blocks={blocks} logo="https://example.com/a.png" {...props} />);
}

describe('canvas', () => {
  it('draws only the Slack surface by default', () => {
    const html = render();
    expect(html).toContain('Approve');
    for (const chrome of ['Copy JSON', 'Block Kit Builder', 'Valid Block Kit payload', 'Interactions', 'Simulate']) {
      expect(html).not.toContain(chrome);
    }
  });

  it('draws the toolbar, validation banner and simulator with `chrome`', () => {
    const html = render({ chrome: true });
    for (const chrome of ['Copy JSON', 'Block Kit Builder', 'Valid Block Kit payload', 'Interactions', 'Simulate']) {
      expect(html).toContain(chrome);
    }
  });

  it('takes the modal title and button labels from `modal`', () => {
    const html = render({ surface: 'modal', modal: { title: 'Invite teammates', submit: 'Send', close: 'Not now' } });
    expect(html).toContain('Invite teammates');
    expect(html).toContain('Send');
    expect(html).toContain('Not now');
    expect(html).not.toContain('Modal title');
  });

  it('drops the Submit button with `submit: false`', () => {
    expect(render({ surface: 'modal', modal: { submit: false } })).not.toContain('Submit');
  });

  it('renders identically every time once `time` is pinned', () => {
    const time = '2026-09-29T15:04:00Z';
    expect(render({ time, name: 'Tightknit' })).toBe(render({ time, name: 'Tightknit' }));
    expect(render({ name: 'Tightknit' })).toContain('Tightknit');
  });
});

describe('matchClickedLabel', () => {
  const interactions = extractInteractions([
    ...blocks,
    {
      type: 'actions',
      elements: [
        button('Open', 'open_a'),
        button('Open', 'open_b'),
        { type: 'static_select', action_id: 'pick', placeholder: { type: 'plain_text', text: 'Pick' } }
      ]
    }
  ] as unknown as Block[]);

  it('maps a clicked label to its button', () => {
    expect(matchClickedLabel(interactions, ' Approve ')?.action_id).toBe('approve');
  });

  it('refuses to guess between buttons that share a label', () => {
    expect(matchClickedLabel(interactions, 'Open')).toBeUndefined();
  });

  it('ignores non-button elements and unknown labels', () => {
    expect(matchClickedLabel(interactions, 'Pick')).toBeUndefined();
    expect(matchClickedLabel(interactions, 'Cancel')).toBeUndefined();
  });
});

describe('resolveParameter', () => {
  it('accepts the bare, object and function forms', () => {
    expect(resolveParameter(blocks, {})?.blocks).toBe(blocks);
    expect(resolveParameter({ blocks, theme: 'dark' }, {})?.theme).toBe('dark');
    expect(resolveParameter((args) => ({ blocks, surface: args.s as 'home' }), { s: 'home' })?.surface).toBe('home');
  });

  it('falls back to args.blocks, keeping only valid theme / surface args', () => {
    const resolved = resolveParameter(undefined, { blocks, theme: 'dark', surface: 'app_home' });
    expect(resolved).toEqual({ blocks, theme: 'dark' });
  });

  it('returns null when opted out or when there is nothing to show', () => {
    expect(resolveParameter(false, { blocks })).toBeNull();
    expect(resolveParameter(undefined, {})).toBeNull();
  });
});

it('validates a modal against the Submit button it actually draws', () => {
  const form = [
    {
      type: 'input',
      label: { type: 'plain_text', text: 'Name' },
      element: { type: 'plain_text_input', action_id: 'name' }
    }
  ] as unknown as Block[];
  expect(validateForSurface(form, 'modal').valid).toBe(true);
  expect(validateForSurface(form, 'modal', { submit: false }).valid).toBe(false);
});
