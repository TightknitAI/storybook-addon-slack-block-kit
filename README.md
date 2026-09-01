# @tightknitai/storybook-addon-slack-block-kit

A Storybook 10 addon that renders Slack Block Kit JSON the way Slack would, validates it against the official rule set, and lets you simulate interactions — all inline with your stories.

## What you get

- ✅ **Decorator** — every story whose `parameters.slackBlocks` is set gets a Slack-rendered preview below it.
- ✅ **Three surfaces** — toolbar globals flip every preview between **Message**, **Modal**, and **App Home** chrome. Blocks always render inside a real Slack surface, so you can see how they'll actually look.
- ✅ **Live validation** — every preview runs through [`@tightknitai/slack-block-kit-validator`](https://www.npmjs.com/package/@tightknitai/slack-block-kit-validator). Errors show up inline above the preview and in the addon panel, so you catch malformed payloads at story-time instead of in production.
- ✅ **Interaction simulator** — buttons, selects, datepickers etc. are listed below every preview with a "Simulate" action that fires a payload identical to what Slack would POST to your interactivity endpoint.
- ✅ **Args-driven blocks** — pass a function for `parameters.slackBlocks` to derive blocks from story args, so Storybook Controls drive the preview live.
- ✅ **Open in Block Kit Builder** — one-click handoff to Slack's hosted editor with the payload preloaded.
- ✅ **Copy as JSON** — grab the rendered payload to paste into Postman, a webhook test, or a `chat.postMessage` call.
- ✅ **MDX doc block** — `<SlackPreview blocks={...} />` for use in your own MDX pages or React tests.
- ✅ **URL allowlist** — every URL in a payload is held to `http` / `https` / `mailto` before it reaches an `<a href>` or `<img src>`, the way Slack sanitizes server-side. See [URL safety](#url-safety).
- ⚠ **Addon panel** — renders the validation report + JSON/Builder controls; does NOT render the Slack preview itself (the decorator does that inline). See [AGENTS.md](./AGENTS.md) → "Known risks → Manager-side rendering".

Rendering is delegated to [`slack-blocks-to-jsx`](https://www.npmjs.com/package/slack-blocks-to-jsx); validation to [`@tightknitai/slack-block-kit-validator`](https://www.npmjs.com/package/@tightknitai/slack-block-kit-validator). The addon is a thin Storybook wrapper around them.

### Block catalog

The dogfood Storybook ships a `Slack Blocks` story group with one example per block type the renderer supports — the 14 blocks `@tightknitai/block-kit-builder` catalogs (`section`, `header`, `divider`, `context`, `actions`, `image`, `markdown`, `rich_text`, `table`, `alert`, `card`, `carousel`, `context_actions`, `input`) plus the four extra ones `slack-blocks-to-jsx` ships out of the box (`file`, `video`, `plan`, `task_card`). See [stories/Blocks.stories.tsx](stories/Blocks.stories.tsx).

## Install

```bash
pnpm add -D @tightknitai/storybook-addon-slack-block-kit
```

Then list it in `.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@tightknitai/storybook-addon-slack-block-kit']
};

export default config;
```

## Use

### Bare blocks

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from './MyComponent';

const meta = { title: 'MyComponent', component: MyComponent } satisfies Meta<typeof MyComponent>;
export default meta;

export const SectionAndButton: StoryObj<typeof meta> = {
  parameters: {
    slackBlocks: [
      { type: 'section', text: { type: 'mrkdwn', text: '*Hello* from Slack' } },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open', emoji: true },
            style: 'primary',
            action_id: 'open'
          }
        ]
      }
    ]
  }
};
```

### Object form (per-story overrides + interactions)

```tsx
parameters: {
  slackBlocks: {
    blocks: [/* ... */],
    theme: 'dark',          // override toolbar global
    surface: 'modal',       // 'message' | 'modal' | 'home'
    hooks: { /* user/channel/emoji hooks — see below */ },
    layout: 'panel-only',   // hide inline preview; only addon panel renders it
    validate: false,        // disable the validation banner
    onInteraction: (payload) => {
      // fires when the user clicks Simulate on a button/select/etc.
      // payload mirrors Slack's interactivity POST body
      console.log(payload);
    }
  }
}
```

### Args-driven (function form)

For designers who want to tweak text/labels/options through Storybook Controls:

```tsx
const meta = {
  args: { title: 'Deploy ready', body: '_All green._', buttonLabel: 'Deploy' },
  parameters: {
    slackBlocks: (args) => [
      { type: 'header', text: { type: 'plain_text', text: args.title, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: args.body } },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: args.buttonLabel, emoji: true },
            action_id: 'deploy'
          }
        ]
      }
    ]
  }
} satisfies Meta<typeof MyComponent>;
```

### `hooks` examples

Slack references users/channels/emoji by ID on the wire (`<@U123>`, `<#C456>`, `:sparkles:`). The renderer surfaces those as hook calls so you can resolve them against your own directory before display:

```tsx
parameters: {
  slackBlocks: {
    blocks: [/* rich_text with a user/channel/emoji */],
    hooks: {
      user: ({ user_id }) => <UserChip id={user_id} />,
      channel: ({ channel_id }) => <ChannelChip id={channel_id} />,
      emoji: ({ name }, parseFallback) =>
        name === 'sparkles' ? <CustomSparkles /> : parseFallback({ name })
    }
  }
}
```

The full hook shape is defined upstream in [`slack-blocks-to-jsx`'s `Hooks` type](https://www.npmjs.com/package/slack-blocks-to-jsx).

### MDX doc block

```mdx
import { SlackPreview } from '@tightknitai/storybook-addon-slack-block-kit';

<SlackPreview
  blocks={[{ type: 'section', text: { type: 'mrkdwn', text: '*hi*' } }]}
  surface="home"
/>
```

### Standalone renderer

```tsx
import { Renderer } from '@tightknitai/storybook-addon-slack-block-kit';

<Renderer blocks={blocks} theme="light" surface="message" />
```

### Standalone helpers

The validator and Block Kit Builder URL helpers are re-exported, so consumers can reuse them in tests or in their own tooling:

```tsx
import {
  validateForSurface,
  buildBlockKitBuilderUrl,
  extractInteractions
} from '@tightknitai/storybook-addon-slack-block-kit';

// In a unit test next to your block builder:
const { valid, errors } = validateForSurface(buildBlocks(input), 'message');
expect(valid).toBe(true);
```

## URL safety

Slack sanitizes URLs server-side before it renders a message. `slack-blocks-to-jsx` doesn't, so the addon does it here: every URL in a payload is checked against an `http` / `https` / `mailto` allowlist before render, and anything else — `javascript:`, `data:`, `vbscript:`, custom app schemes — is dropped.

This matters when a story renders blocks it didn't author: a design system previewing real messages, a docs page rendering user-submitted payloads, a fixture pulled from a Slack export. Without the check a `rich_text` link with `url: "javascript:…"` reaches the DOM verbatim on React 18 (React 19 blocks that particular scheme itself; `data:` gets through on both).

Two layers, because URLs arrive two ways:

- **URL fields** (`image_url`, `video_url`, a `rich_text` link's `url`, `slack_file.url`, …) are stripped from the payload before it renders — including nested ones, at any depth.
- **Links spelled inside mrkdwn** — Slack's `<url|label>` syntax, markdown `[label](url)`, `<!date^…^url|fallback>` — can't be rewritten without mangling the text, so they're caught at render time. The link keeps its label and loses its target.

Either way the preview says what it dropped, in an amber notice above the blocks and in the addon panel — the payload never changes silently. Safe URLs render exactly as before, and a `hooks.link` you pass still receives them.

The same check is exported if you want it in your own tooling:

```tsx
import { isSafeUrl, sanitizeBlockUrls } from '@tightknitai/storybook-addon-slack-block-kit';

isSafeUrl('https://example.com'); // true
isSafeUrl('javascript:alert(1)'); // false

const { blocks, removed } = sanitizeBlockUrls(untrustedBlocks);
// removed: ['javascript:alert(1)']
```

Note that this protects the *preview*. Blocks you send to Slack should be validated on the way in as well — `validateForSurface` covers shape, `sanitizeBlockUrls` covers URLs.

## Develop

```bash
pnpm install
pnpm storybook    # dogfood: opens this repo's own stories at :6007
pnpm build        # tsup → dist/ (index, preview, manager, preset)
pnpm typecheck
pnpm lint
pnpm test
```

`.storybook/local-preset.ts` wires the addon source directly so changes hot-reload without rebuilding.

## See also

- [`@tightknitai/slack-block-kit-validator`](https://github.com/TightknitAI/slack-block-kit-validator) — the JSON Schema + caveat helpers that power the validation banner.
- [`@tightknitai/block-kitchen`](https://github.com/TightknitAI/block-kitchen) — drag-and-drop visual builder that ships the same `SlackBlockPreview` renderer the addon mirrors.

## License

MIT. See [LICENSE](./LICENSE).
