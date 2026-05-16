# @tightknitai/storybook-addon-slack-block-kit

A Storybook 10 addon that renders Slack Block Kit JSON the way Slack would. Drop it into any React Storybook to give Slack-targeted components a faithful side-by-side preview.

> **Status: alpha (v0).** Scaffolded but not yet smoke-tested against a fresh consumer project. See [AGENTS.md](./AGENTS.md) for the current state and known risks before publishing.

## What you get (v0)

- ✅ **Decorator** — every story whose `parameters.slackBlocks` is set gets a Slack-rendered preview below it.
- ✅ **Toolbar globals** — `Slack theme` (light / dark) and `Slack surface` (message / modal) dropdowns flip every preview at once. Blocks always render inside a real Slack surface — message envelope or modal chrome — so you can see how they'll actually look.
- ✅ **Standalone renderer / MDX doc block** — `<SlackPreview blocks={...} />` exported for use in your own MDX or React tests.
- ⚠ **Addon panel** — registered, but stubbed in v0. The decorator renders inline; the panel reports the block count. The full panel rendering is the v1 priority (see [AGENTS.md](./AGENTS.md)).

Rendering is delegated to [`slack-blocks-to-jsx`](https://www.npmjs.com/package/slack-blocks-to-jsx) — no custom renderer, no fork. The addon is a thin Storybook wrapper around that library.

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

### Story parameter

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

Or pass the object form for per-story overrides:

```tsx
parameters: {
  slackBlocks: {
    blocks: [/* ... */],
    theme: 'dark',          // override toolbar global
    surface: 'modal',       // override toolbar global
    hooks: { /* user/channel/emoji hooks */ },
    layout: 'panel-only'    // hide inline preview; only addon panel renders it
  }
}
```

### MDX doc block

```mdx
import { SlackPreview } from '@tightknitai/storybook-addon-slack-block-kit';

<SlackPreview
  blocks={[{ type: 'section', text: { type: 'mrkdwn', text: '*hi*' } }]}
/>
```

### Standalone renderer

```tsx
import { Renderer } from '@tightknitai/storybook-addon-slack-block-kit';

<Renderer blocks={blocks} theme="light" surface="message" />
```

## Develop

```bash
pnpm install
pnpm storybook    # dogfood: opens this repo's own stories at :6007
pnpm build        # tsup → dist/ (index, preview, manager, preset)
pnpm typecheck
pnpm lint
```

`.storybook/local-preset.ts` wires the addon source directly so changes hot-reload without rebuilding.

## See also

- [`@tightknitai/block-kit-builder`](https://github.com/TightknitAI/block-kit-builder) — drag-and-drop visual builder that ships the same `SlackBlockPreview` renderer the addon mirrors.

## License

MIT. See [LICENSE](./LICENSE).
