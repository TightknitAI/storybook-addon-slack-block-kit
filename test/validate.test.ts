import type { Block } from 'slack-blocks-to-jsx';
import { describe, expect, it } from 'vitest';
import { buildBlockKitBuilderUrl } from '../src/builder-url';
import { withUnrenderedPlaceholders } from '../src/renderer';
import { isSurfaceError, validateForSurface } from '../src/validate';

const b = (blocks: unknown[]) => blocks as Block[];

const nameInput = {
  type: 'input',
  label: { type: 'plain_text', text: 'Name' },
  element: { type: 'plain_text_input', action_id: 'name' }
};
const fileInput = {
  type: 'input',
  label: { type: 'plain_text', text: 'Files' },
  element: { type: 'file_input', action_id: 'files' }
};
const alert = { type: 'alert', level: 'info', text: { type: 'mrkdwn', text: 'hi' } };
const markdown = { type: 'markdown', text: '**hi**' };

describe('validateForSurface — modal envelope', () => {
  it('accepts input blocks in a modal (envelope carries submit)', () => {
    const result = validateForSurface(b([nameInput, fileInput]), 'modal');
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('puts submit in the Builder deeplink envelope too', () => {
    const url = buildBlockKitBuilderUrl(b([nameInput]), 'modal');
    const payload = JSON.parse(decodeURIComponent(url.split('#')[1]));
    expect(payload.submit).toEqual({ type: 'plain_text', text: 'Submit' });
  });
});

describe('validateForSurface — surface compatibility', () => {
  it.each([
    ['file_input on home', [fileInput], 'home'],
    ['file_input on message', [fileInput], 'message'],
    ['alert on message', [alert], 'message'],
    ['alert on home', [alert], 'home'],
    ['markdown on modal', [markdown], 'modal'],
    ['markdown on home', [markdown], 'home']
  ] as const)('flags %s as a surface error', (_name, blocks, surface) => {
    const result = validateForSurface(b([...blocks]), surface);
    expect(result.valid).toBe(false);
    expect(result.surface).toBe(surface);
    expect(result.surfaceErrors).toHaveLength(1);
    expect(result.otherErrors).toEqual([]);
  });

  it.each([
    ['alert on modal', [alert], 'modal'],
    ['markdown on message', [markdown], 'message'],
    ['plain input on message', [nameInput], 'message']
  ] as const)('accepts %s', (_name, blocks, surface) => {
    expect(validateForSurface(b([...blocks]), surface).valid).toBe(true);
  });

  it('flags more than 50 blocks on a message but not in a modal', () => {
    const blocks = b(Array.from({ length: 51 }, () => ({ type: 'divider' })));
    expect(validateForSurface(blocks, 'message').surfaceErrors).toHaveLength(1);
    expect(validateForSurface(blocks, 'modal').valid).toBe(true);
  });

  it('still reports surface errors when the schema rejects the payload', () => {
    // The validator returns schema errors alone; the adapter re-runs the
    // surface check so the markdown-on-home problem isn't hidden.
    const result = validateForSurface(b([{ type: 'section' }, markdown]), 'home');
    expect(result.otherErrors.length).toBeGreaterThan(0);
    expect(result.surfaceErrors).toEqual(["blocks[1].type 'markdown' is not allowed on surface 'home'"]);
    expect(result.errors).toEqual([...result.otherErrors, ...result.surfaceErrors]);
  });

  it('keeps non-surface findings out of the surface group', () => {
    const result = validateForSurface(
      b([
        { type: 'divider', block_id: 'x' },
        { type: 'divider', block_id: 'x' }
      ]),
      'message'
    );
    expect(result.surfaceErrors).toEqual([]);
    expect(result.otherErrors.join('\n')).toMatch(/block_id/);
  });
});

describe('isSurfaceError', () => {
  it('recognizes each surface message shape the validator emits', () => {
    expect(isSurfaceError("blocks[0].type 'table' is not allowed on surface 'modal'")).toBe(true);
    expect(isSurfaceError("blocks[0].element.type 'file_input' is only allowed in modal surfaces (got 'home')")).toBe(
      true
    );
    expect(isSurfaceError("surface 'message' allows at most 50 blocks (got 51)")).toBe(true);
    expect(isSurfaceError("blocks[0]: must have required property 'text'")).toBe(false);
  });
});

describe('withUnrenderedPlaceholders', () => {
  it('returns the same array when every block is renderable', () => {
    const blocks = b([{ type: 'divider' }, markdown]);
    expect(withUnrenderedPlaceholders(blocks)).toBe(blocks);
  });

  it('swaps unsupported blocks for a context line naming the type', () => {
    const out = withUnrenderedPlaceholders(b([{ type: 'divider' }, { type: 'data_table', rows: [] }]));
    expect(out[0]).toEqual({ type: 'divider' });
    expect(out[1]).toMatchObject({ type: 'context' });
    expect(JSON.stringify(out[1])).toContain('data_table');
  });
});
