import type { Block } from 'slack-blocks-to-jsx';

/**
 * URL schemes allowed to reach an `<a href>` or `<img src>` in the
 * preview. Slack sanitizes URLs server-side before it renders a message;
 * `slack-blocks-to-jsx` does not, so the addon has to do it here or a
 * `javascript:` URL in a block payload ends up in the DOM verbatim.
 *
 * `http` / `https` / `mailto` is what Slack itself accepts in Block Kit
 * URL fields. Everything else — `javascript:`, `data:`, `vbscript:`,
 * `file:`, custom app schemes — is stripped.
 */
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto']);

/**
 * Object keys whose string values reach a URL sink in
 * `slack-blocks-to-jsx`:
 *
 *  - `url` — rich_text `link`, `slack_file`, the `url` source element,
 *    button and overflow-option URLs
 *  - `image_url` — image block, image element/accessory, context image,
 *    card hero + icon, container icon
 *  - `video_url` / `thumbnail_url` / `title_url` / `provider_icon_url` —
 *    video block (the first lands in an `<iframe src>`)
 *  - `icon` / `image` / `href` / `src` — the library's own non-Slack
 *    element props
 *
 * Any future `*_url` field is covered by the suffix rule in `isUrlKey`.
 */
const URL_KEYS = new Set(['url', 'href', 'src', 'icon', 'image']);

// Browsers ignore ASCII whitespace and control characters when they
// resolve a URL, so the scheme has to be read with those removed —
// otherwise `java\tscript:alert(1)` and ` javascript:alert(1)` both read
// as scheme-less (and therefore "safe") while the browser still navigates
// them as `javascript:`. Written as a loop rather than a regex so no
// literal control characters end up in this file.
function stripIgnoredCharacters(url: string): string {
  let out = '';
  for (const char of url) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0x20 && code !== 0x7f) out += char;
  }
  return out;
}

/**
 * True when `url` is safe to hand to an `href` or `src` attribute.
 *
 * The parsing rules mirror the check `react-markdown` applies to markdown
 * links — a URL with no scheme is relative and therefore safe, and a colon
 * that lands after the first `/`, `?` or `#` belongs to the path, query or
 * fragment rather than a scheme — but with the tighter scheme set above.
 */
export function isSafeUrl(url: string): boolean {
  const value = stripIgnoredCharacters(url);
  const colon = value.indexOf(':');
  if (colon === -1) return true;

  const slash = value.indexOf('/');
  const question = value.indexOf('?');
  const hash = value.indexOf('#');
  if (slash !== -1 && colon > slash) return true;
  if (question !== -1 && colon > question) return true;
  if (hash !== -1 && colon > hash) return true;

  return SAFE_SCHEMES.has(value.slice(0, colon).toLowerCase());
}

export interface SanitizedBlocks {
  /**
   * The payload with every unsafe URL field removed. Referentially equal
   * to the input when there was nothing to strip.
   */
  blocks: Block[];
  /** Every URL that was stripped, in payload order. Empty when clean. */
  removed: string[];
}

function isUrlKey(key: string): boolean {
  return URL_KEYS.has(key) || key.endsWith('_url');
}

// Blocks are JSON, but the parameter is hand-written JS and can hold
// anything. Only plain objects are cloned field-by-field; class instances
// pass through untouched rather than being flattened into `{}`.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function sanitizeValue(value: unknown, removed: string[]): unknown {
  if (Array.isArray(value)) return value.map((entry) => sanitizeValue(entry, removed));
  if (!isPlainObject(value)) return value;

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    // Drop the key rather than blanking it: an absent `image_url` renders
    // as a missing image, where `image_url: ''` resolves against the
    // Storybook origin and fires a bogus request.
    if (typeof entry === 'string' && isUrlKey(key) && !isSafeUrl(entry)) {
      removed.push(entry);
      continue;
    }
    out[key] = sanitizeValue(entry, removed);
  }
  return out;
}

/**
 * Strips every URL field with an unsafe scheme from a Block Kit payload,
 * returning a copy plus the list of what was removed.
 *
 * This covers URLs that live in their own field. Links parsed out of
 * mrkdwn text — Slack's `<url|label>` syntax, markdown `[label](url)`,
 * `<!date^…^url|fallback>` — carry their URL inside the text and can't be
 * rewritten here without mangling the text; those are caught at render
 * time by the `link` hook the renderer installs.
 */
export function sanitizeBlockUrls(blocks: Block[]): SanitizedBlocks {
  const removed: string[] = [];
  const sanitized = sanitizeValue(blocks, removed) as Block[];
  return { blocks: removed.length === 0 ? blocks : sanitized, removed };
}
