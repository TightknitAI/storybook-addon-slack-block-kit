import { describe, expect, it } from 'vitest';
import * as api from '../src/index';

describe('public API surface', () => {
  it('exports the expected runtime values', () => {
    expect(typeof api.SlackPreview).toBe('function');
    expect(typeof api.Renderer).toBe('function');
    expect(typeof api.withSlackPreview).toBe('function');
    expect(typeof api.validateForSurface).toBe('function');
    expect(typeof api.buildBlockKitBuilderUrl).toBe('function');
    expect(typeof api.extractInteractions).toBe('function');
  });

  it('exports stable addon constants', () => {
    expect(api.ADDON_ID).toBe('tightknitai/slack-block-kit');
    expect(api.PANEL_ID).toBe('tightknitai/slack-block-kit/panel');
    expect(api.PARAM_KEY).toBe('slackBlocks');
    expect(api.GLOBAL_THEME_KEY).toBe('slackTheme');
    expect(api.GLOBAL_SURFACE_KEY).toBe('slackSurface');
  });
});

describe('validateForSurface', () => {
  it('passes a healthy message', () => {
    const result = api.validateForSurface([{ type: 'section', text: { type: 'mrkdwn', text: 'hello' } }], 'message');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('flags duplicate block_ids', () => {
    const result = api.validateForSurface(
      [
        { type: 'divider', block_id: 'x' },
        { type: 'divider', block_id: 'x' }
      ],
      'message'
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toMatch(/block_id/);
  });

  it('rejects table blocks on the modal surface', () => {
    // `table` is in the validator's BLOCKS_NOT_ALLOWED_IN_MODAL set —
    // it renders fine on messages and home tabs but Slack rejects it
    // inside modal views.
    const result = api.validateForSurface(
      [
        {
          type: 'table',
          rows: [[{ type: 'rich_text', elements: [] }]]
        }
      ],
      'modal'
    );
    expect(result.valid).toBe(false);
  });

  it('wraps blocks in a home view envelope when surface is home', () => {
    const result = api.validateForSurface([{ type: 'section', text: { type: 'mrkdwn', text: 'home' } }], 'home');
    expect(result.valid).toBe(true);
  });
});

describe('buildBlockKitBuilderUrl', () => {
  it('encodes bare blocks for message surface', () => {
    const url = api.buildBlockKitBuilderUrl([{ type: 'section', text: { type: 'mrkdwn', text: 'hi' } }], 'message');
    expect(url).toMatch(/^https:\/\/app\.slack\.com\/block-kit-builder#/);
    const payload = JSON.parse(decodeURIComponent(url.split('#')[1]));
    expect(payload).toEqual({ blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'hi' } }] });
  });

  it('wraps blocks in a modal envelope', () => {
    const url = api.buildBlockKitBuilderUrl([], 'modal');
    const payload = JSON.parse(decodeURIComponent(url.split('#')[1]));
    expect(payload.type).toBe('modal');
    expect(payload.title).toBeTruthy();
  });

  it('wraps blocks in a home envelope', () => {
    const url = api.buildBlockKitBuilderUrl([], 'home');
    const payload = JSON.parse(decodeURIComponent(url.split('#')[1]));
    expect(payload.type).toBe('home');
  });
});

describe('extractInteractions', () => {
  it('returns nothing for purely static blocks', () => {
    expect(
      api.extractInteractions([{ type: 'section', text: { type: 'mrkdwn', text: 'hi' } }, { type: 'divider' }])
    ).toEqual([]);
  });

  it('extracts buttons from an actions block', () => {
    const interactions = api.extractInteractions([
      {
        type: 'actions',
        block_id: 'b1',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Go' },
            action_id: 'go',
            value: 'v'
          }
        ]
      }
    ]);
    expect(interactions).toEqual([
      {
        type: 'button',
        action_id: 'go',
        block_id: 'b1',
        value: 'v',
        label: 'Go'
      }
    ]);
  });

  it('extracts a section accessory', () => {
    const interactions = api.extractInteractions([
      {
        type: 'section',
        block_id: 'b2',
        text: { type: 'mrkdwn', text: 'x' },
        accessory: {
          type: 'static_select',
          action_id: 'pick',
          placeholder: { type: 'plain_text', text: 'Pick…' },
          options: []
        }
      }
    ]);
    expect(interactions[0]).toMatchObject({
      type: 'static_select',
      action_id: 'pick',
      block_id: 'b2',
      label: 'Pick…'
    });
  });
});
