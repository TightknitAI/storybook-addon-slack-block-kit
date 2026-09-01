import type { Block } from 'slack-blocks-to-jsx';
import { describe, expect, it } from 'vitest';
import { isSafeUrl, sanitizeBlockUrls } from '../src/sanitize';

describe('isSafeUrl', () => {
  it('allows the schemes Slack accepts', () => {
    expect(isSafeUrl('https://example.com/x?a=1#b')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('mailto:someone@example.com')).toBe(true);
    expect(isSafeUrl('HTTPS://EXAMPLE.COM')).toBe(true);
  });

  it('allows relative URLs, which carry no scheme to abuse', () => {
    expect(isSafeUrl('')).toBe(true);
    expect(isSafeUrl('/static/logo.png')).toBe(true);
    expect(isSafeUrl('./a:b')).toBe(true);
    expect(isSafeUrl('?q=a:b')).toBe(true);
    expect(isSafeUrl('#a:b')).toBe(true);
    expect(isSafeUrl('//example.com/x')).toBe(true);
  });

  it('rejects script-bearing and other unlisted schemes', () => {
    expect(isSafeUrl('javascript:alert(document.domain)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('slack://channel?id=C123')).toBe(false);
  });

  it('rejects schemes hidden behind characters browsers ignore', () => {
    expect(isSafeUrl('JaVaScRiPt:alert(1)')).toBe(false);
    expect(isSafeUrl('  javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('java\tscript:alert(1)')).toBe(false);
    expect(isSafeUrl('java\nscript:alert(1)')).toBe(false);
    expect(isSafeUrl('java\r\nscript:alert(1)')).toBe(false);
    expect(isSafeUrl(`${String.fromCharCode(0)}javascript:alert(1)`)).toBe(false);
    expect(isSafeUrl(`jav${String.fromCharCode(127)}ascript:alert(1)`)).toBe(false);
  });
});

describe('sanitizeBlockUrls', () => {
  it('leaves a clean payload untouched, identity included', () => {
    const blocks = [
      { type: 'section', text: { type: 'mrkdwn', text: '<https://example.com|hi>' } },
      { type: 'image', image_url: 'https://example.com/cat.png', alt_text: 'cat' }
    ] as unknown as Block[];

    const result = sanitizeBlockUrls(blocks);

    expect(result.removed).toEqual([]);
    expect(result.blocks).toBe(blocks);
  });

  it('strips a javascript: URL from a rich_text link and reports it', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'link', url: 'javascript:alert(document.domain)', text: 'Click me' }]
          }
        ]
      }
    ] as unknown as Block[];

    const { blocks: safe, removed } = sanitizeBlockUrls(blocks);

    expect(removed).toEqual(['javascript:alert(document.domain)']);
    const link = (safe[0] as never as { elements: { elements: Record<string, unknown>[] }[] }).elements[0].elements[0];
    expect(link).toEqual({ type: 'link', text: 'Click me' });
    expect('url' in link).toBe(false);
  });

  it('does not mutate the payload it was given', () => {
    const blocks = [{ type: 'image', image_url: 'javascript:alert(1)', alt_text: 'x' }] as unknown as Block[];

    sanitizeBlockUrls(blocks);

    expect(blocks[0]).toEqual({ type: 'image', image_url: 'javascript:alert(1)', alt_text: 'x' });
  });

  it('covers every URL-bearing field that reaches an href or src', () => {
    const bad = 'javascript:alert(1)';
    const blocks = [
      { type: 'image', image_url: bad, alt_text: 'x' },
      { type: 'image', slack_file: { url: bad }, alt_text: 'x' },
      { type: 'section', text: { type: 'mrkdwn', text: 'x' }, accessory: { type: 'image', image_url: bad } },
      { type: 'context', elements: [{ type: 'image', image_url: bad, alt_text: 'x' }] },
      {
        type: 'video',
        title: { type: 'plain_text', text: 'v' },
        video_url: bad,
        thumbnail_url: bad,
        title_url: bad,
        provider_icon_url: bad
      },
      { type: 'card', hero_image: { image_url: bad }, icon: { image_url: bad } },
      { type: 'container', icon: { type: 'image', image_url: bad }, child_blocks: [] },
      { type: 'actions', elements: [{ type: 'url', url: bad, text: 'x' }] },
      {
        type: 'actions',
        elements: [{ type: 'button', text: { type: 'plain_text', text: 'b' }, url: bad }]
      },
      {
        type: 'actions',
        elements: [{ type: 'overflow', options: [{ text: { type: 'plain_text', text: 'o' }, url: bad }] }]
      }
    ] as unknown as Block[];

    const { blocks: safe, removed } = sanitizeBlockUrls(blocks);

    expect(removed).toHaveLength(14);
    expect(removed.every((url) => url === bad)).toBe(true);
    expect(JSON.stringify(safe)).not.toContain('javascript:');
  });

  it('keeps sibling fields and non-URL strings that merely look odd', () => {
    const blocks = [
      {
        type: 'actions',
        elements: [{ type: 'icon_button', icon: 'trash', text: { type: 'plain_text', text: 'Delete' }, action_id: 'd' }]
      },
      { type: 'section', text: { type: 'mrkdwn', text: 'ratio 3:4' }, block_id: 'b1' }
    ] as unknown as Block[];

    const { blocks: safe, removed } = sanitizeBlockUrls(blocks);

    expect(removed).toEqual([]);
    expect(safe).toEqual(blocks);
  });

  it('walks arrays and nested blocks of any depth', () => {
    const blocks = [
      {
        type: 'container',
        child_blocks: [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_list',
                elements: [
                  {
                    type: 'rich_text_section',
                    elements: [{ type: 'link', url: 'vbscript:msgbox(1)', text: 'deep' }]
                  }
                ]
              }
            ]
          }
        ]
      }
    ] as unknown as Block[];

    const { blocks: safe, removed } = sanitizeBlockUrls(blocks);

    expect(removed).toEqual(['vbscript:msgbox(1)']);
    expect(JSON.stringify(safe)).not.toContain('vbscript:');
  });

  it('tolerates a payload that is not shaped like Block Kit at all', () => {
    const blocks = [
      null,
      'not a block',
      42,
      { type: 'section', text: undefined, url: 'javascript:alert(1)' }
    ] as unknown as Block[];

    const { blocks: safe, removed } = sanitizeBlockUrls(blocks);

    expect(removed).toEqual(['javascript:alert(1)']);
    expect(safe[0]).toBeNull();
    expect(safe[1]).toBe('not a block');
    expect(safe[2]).toBe(42);
  });
});
