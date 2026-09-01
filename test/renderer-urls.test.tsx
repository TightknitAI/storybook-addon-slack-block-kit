import { renderToStaticMarkup } from 'react-dom/server';
import { type Block, Message } from 'slack-blocks-to-jsx';
import { describe, expect, it, vi } from 'vitest';
import { Renderer, safeLinkHooks } from '../src/renderer';

const XSS = 'javascript:alert(document.domain)';

/** Every `href` / `src` value the rendered markup puts in the DOM. */
function urlAttributes(html: string): string[] {
  return (html.match(/(?:href|src)="[^"]*"/g) ?? []).map((attr) => attr.slice(attr.indexOf('"') + 1, -1));
}

/**
 * Whether a URL that reached the DOM can run script or impersonate a page.
 *
 * Written out here rather than reusing `isSafeUrl` from the source: these
 * are the assertions that have to keep holding if the sanitizer itself
 * regresses, so they must not share its definition of "safe". React 19
 * rewrites a `javascript:` href to `javascript:throw new Error(…)`, which
 * still matches — the point is that nothing in that family gets as far as
 * an attribute.
 */
function isDangerous(url: string): boolean {
  let collapsed = '';
  for (const char of url) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0x20 && code !== 0x7f) collapsed += char;
  }
  return /^(javascript|data|vbscript|file):/i.test(collapsed);
}

/**
 * Renders with an `https:` avatar so the only URLs in the markup come from
 * the blocks. The addon's default logo is an inline `data:` SVG, which is
 * a prop the addon sets itself rather than payload the story was handed.
 */
function render(blocks: unknown[], props: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(<Renderer blocks={blocks as Block[]} logo="https://example.com/avatar.png" {...props} />);
}

/** Same markup, attributes in a stable order, for equality assertions. */
function withSortedAttributes(html: string): string {
  return html.replace(/<([a-z0-9-]+)((?:\s+[a-zA-Z-]+="[^"]*")+)(\s*\/?)>/g, (_match, tag, attrs, close) => {
    const sorted = (attrs.match(/[a-zA-Z-]+="[^"]*"/g) ?? []).sort().join(' ');
    return `<${tag} ${sorted}${close}>`;
  });
}

// One entry per path that reaches an `<a href>` or `<img src>` in
// `slack-blocks-to-jsx`. The URL-field cases are stripped from the payload
// by `sanitizeBlockUrls`; the ones that spell the link inside mrkdwn text
// are caught by the renderer's `link` hook.
const attacks: Record<string, unknown[]> = {
  'rich_text link (the reported payload)': [
    {
      type: 'rich_text',
      elements: [{ type: 'rich_text_section', elements: [{ type: 'link', url: XSS, text: 'Click me' }] }]
    }
  ],
  'rich_text link inside a quote': [
    {
      type: 'rich_text',
      elements: [{ type: 'rich_text_quote', elements: [{ type: 'link', url: XSS, text: 'Click me' }] }]
    }
  ],
  'rich_text link inside a list': [
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_list',
          style: 'bullet',
          elements: [{ type: 'rich_text_section', elements: [{ type: 'link', url: XSS, text: 'c' }] }]
        }
      ]
    }
  ],
  'mrkdwn <url|label> link': [{ type: 'section', text: { type: 'mrkdwn', text: `<${XSS}|Click me>` } }],
  'mrkdwn markdown link': [{ type: 'section', text: { type: 'mrkdwn', text: `[Click me](${XSS})` } }],
  'mrkdwn link with an uppercased scheme': [
    { type: 'section', text: { type: 'mrkdwn', text: '<JaVaScRiPt:alert(1)|Click me>' } }
  ],
  'mrkdwn date token link': [
    { type: 'section', text: { type: 'mrkdwn', text: `<!date^1700000000^{date}^${XSS}|yesterday>` } }
  ],
  'plain_text link': [{ type: 'section', text: { type: 'plain_text', text: `<${XSS}|Click me>` } }],
  'header link': [{ type: 'header', text: { type: 'plain_text', text: `<${XSS}|Click me>` } }],
  'context link': [{ type: 'context', elements: [{ type: 'mrkdwn', text: `<${XSS}|Click me>` }] }],
  'image block': [{ type: 'image', image_url: XSS, alt_text: 'cat' }],
  'image via slack_file': [{ type: 'image', slack_file: { url: XSS }, alt_text: 'cat' }],
  'section accessory image': [
    { type: 'section', text: { type: 'mrkdwn', text: 'hi' }, accessory: { type: 'image', image_url: XSS } }
  ],
  'context image': [{ type: 'context', elements: [{ type: 'image', image_url: XSS, alt_text: 'x' }] }],
  'video block': [
    {
      type: 'video',
      title: { type: 'plain_text', text: 'v' },
      alt_text: 'v',
      video_url: XSS,
      thumbnail_url: XSS,
      title_url: XSS
    }
  ],
  'url source element': [{ type: 'actions', elements: [{ type: 'url', url: XSS, text: 'x' }] }],
  'data: URL, which React does not block on any version': [
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [{ type: 'link', url: 'data:text/html,<script>alert(1)</script>', text: 'c' }]
        }
      ]
    }
  ]
};

describe('no unsafe URL reaches the DOM', () => {
  for (const [name, blocks] of Object.entries(attacks)) {
    it(name, () => {
      const urls = urlAttributes(render(blocks));
      // Sanity check: this payload does render something with a URL in it,
      // so an empty result can't pass the assertion vacuously.
      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) expect(isDangerous(url), `unsafe URL in the DOM: ${url}`).toBe(false);
    });
  }

  it('renders every surface through the same allowlist', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [{ type: 'rich_text_section', elements: [{ type: 'link', url: XSS, text: 'c' }] }]
      }
    ];
    for (const surface of ['message', 'modal', 'home'] as const) {
      for (const url of urlAttributes(render(blocks, { surface }))) {
        expect(isDangerous(url), `unsafe URL on the ${surface} surface: ${url}`).toBe(false);
      }
    }
  });

  it('keeps the link text so the preview still reads correctly', () => {
    const html = render([
      {
        type: 'rich_text',
        elements: [{ type: 'rich_text_section', elements: [{ type: 'link', url: XSS, text: 'Click me' }] }]
      }
    ]);
    expect(html).toContain('Click me');
  });

  it('reports what it removed instead of silently changing the payload', () => {
    const html = render([{ type: 'image', image_url: XSS, alt_text: 'cat' }]);
    expect(html).toContain('1 unsafe URL removed');
    expect(html).toContain('javascript:alert(document.domain)');
  });
});

describe('safe URLs still render', () => {
  it('leaves http, https and mailto links alone', () => {
    const html = render([
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'link', url: 'https://example.com/docs?a=1#b', text: 'docs' },
              { type: 'link', url: 'mailto:hi@example.com', text: 'mail' }
            ]
          }
        ]
      },
      { type: 'image', image_url: 'https://example.com/cat.png', alt_text: 'cat' }
    ]);

    expect(html).toContain('href="https://example.com/docs?a=1#b"');
    expect(html).toContain('href="mailto:hi@example.com"');
    expect(html).toContain('src="https://example.com/cat.png"');
  });

  it('renders identically to the bare library, hook installed or not', () => {
    const blocks = [
      { type: 'section', text: { type: 'mrkdwn', text: '<https://example.com|link> and [md](https://b.example)' } },
      {
        type: 'rich_text',
        elements: [{ type: 'rich_text_section', elements: [{ type: 'link', url: 'https://c.example', text: 'c' }] }]
      },
      { type: 'section', text: { type: 'mrkdwn', text: '<!date^1700000000^{date}^https://d.example|then>' } },
      // Installing a `link` hook must not disturb anything else the
      // library renders through its hook context.
      { type: 'section', text: { type: 'mrkdwn', text: 'hi <@U12345678> in <#C123|general> :sparkles:' } },
      { type: 'image', image_url: 'https://example.com/cat.png', alt_text: 'cat' },
      {
        type: 'actions',
        elements: [{ type: 'button', text: { type: 'plain_text', text: 'Go' }, action_id: 'go' }]
      }
    ] as Block[];
    const time = new Date('2026-01-01T00:00:00Z');

    const logo = 'https://example.com/avatar.png';
    const withHook = renderToStaticMarkup(
      <Message blocks={blocks} time={time} name="app" logo={logo} hooks={safeLinkHooks() as never} />
    );
    const without = renderToStaticMarkup(<Message blocks={blocks} time={time} name="app" logo={logo} />);

    // Attribute order differs (the hook spreads its own props), so compare
    // the markup with attributes sorted — the anchors themselves must match.
    expect(withSortedAttributes(withHook)).toBe(withSortedAttributes(without));
  });
});

describe('consumer hooks', () => {
  const linkBlocks = (url: string) => [
    {
      type: 'rich_text',
      elements: [{ type: 'rich_text_section', elements: [{ type: 'link', url, text: 'c' }] }]
    }
  ];

  it('still receives safe links', () => {
    const link = vi.fn(() => null);
    render(linkBlocks('https://example.com'), { hooks: { link } });
    expect(link).toHaveBeenCalledWith(expect.objectContaining({ href: 'https://example.com' }));
  });

  it('never receives an unsafe one', () => {
    const link = vi.fn(() => null);

    // From a URL field, which `sanitizeBlockUrls` strips before render…
    render(linkBlocks(XSS), { hooks: { link } });
    // …and from mrkdwn text, which only the hook can catch.
    render([{ type: 'section', text: { type: 'mrkdwn', text: `<${XSS}|c>` } }], { hooks: { link } });

    for (const [data] of link.mock.calls as unknown as [{ href?: string }][]) {
      expect(typeof data.href === 'string' && isDangerous(data.href)).toBe(false);
    }
  });

  it('keeps the other hooks a consumer passed', () => {
    const user = vi.fn(() => null);
    render([{ type: 'section', text: { type: 'mrkdwn', text: '<@U12345678>' } }], { hooks: { user } });
    expect(user).toHaveBeenCalled();
  });
});
