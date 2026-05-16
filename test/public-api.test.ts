import { describe, expect, it } from 'vitest';
import * as api from '../src/index';

describe('public API surface', () => {
  it('exports the expected runtime values', () => {
    expect(typeof api.SlackPreview).toBe('function');
    expect(typeof api.Renderer).toBe('function');
    expect(typeof api.withSlackPreview).toBe('function');
  });

  it('exports stable addon constants', () => {
    expect(api.ADDON_ID).toBe('tightknitai/slack-block-kit');
    expect(api.PANEL_ID).toBe('tightknitai/slack-block-kit/panel');
    expect(api.PARAM_KEY).toBe('slackBlocks');
    expect(api.GLOBAL_THEME_KEY).toBe('slackTheme');
    expect(api.GLOBAL_SURFACE_KEY).toBe('slackSurface');
  });
});
