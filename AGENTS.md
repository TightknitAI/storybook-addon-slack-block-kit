# AGENTS.md — pick-up guide for the next Claude Code session

Read this before doing anything destructive. The user scaffolded this repo in a prior session and asked for a clean handoff doc so a fresh Claude Code session can continue the work.

## What this repo is

`@tightknitai/storybook-addon-slack-block-kit` — a Storybook 10 addon that renders Slack Block Kit JSON the way Slack would. Companion to [`@tightknitai/block-kit-builder`](https://github.com/TightknitAI/block-kit-builder), but with no dependency on the builder. Rendering is delegated to `slack-blocks-to-jsx`.

## v0 feature matrix

| Feature | Status | Notes |
|---|---|---|
| Decorator (`withSlackPreview`) | ✅ working | Preview-side. Renders below the story when `parameters.slackBlocks` is set, or derives blocks from a function form / `args.blocks`. |
| Toolbar globals (theme + surface) | ✅ working | Wired via `preview.ts`'s `globalTypes`. Surface dropdown covers `Message`, `Modal`, and `App Home`. |
| Renderer (`Renderer`) | ✅ working | Blocks always render inside a real surface — `message` (full envelope: avatar / name / timestamp), `modal` (title bar + Cancel/Submit footer), or `home` (Home / Messages / About tab strip). No bare option. |
| Validation banner + panel report | ✅ working | Wraps `@tightknitai/slack-block-kit-validator`. Inline green/red banner above the preview; full structured report in the addon panel. The validator has no transitive `emojilib` dep, so the panel runs fine manager-side. |
| Interaction simulator | ✅ working | `src/interactions.ts` walks the blocks for interactive elements; the chrome renders a "Simulate" button per element that fires `parameters.slackBlocks.onInteraction(payload)` and logs to the console. |
| Args-driven blocks | ✅ working | `parameters.slackBlocks` accepts a function `(args) => Block[] \| { blocks, ... }` so Storybook Controls drive the preview live. |
| Copy as JSON / Open in Block Kit Builder | ✅ working | Top-right of every preview and in the panel. The Builder URL wraps the payload in the correct surface envelope (`{type:'modal',blocks}`, `{type:'home',blocks}`, or bare `{blocks}`). |
| URL scheme allowlist | ✅ working | `src/sanitize.ts` strips every URL field whose scheme isn't `http`/`https`/`mailto`; the renderer's `link` hook catches the ones spelled inside mrkdwn text. Upstream applies no protocol check at all, so this is the only thing between a `javascript:` URL in a payload and an `<a href>` on React 18. Don't drop either layer — `test/renderer-urls.test.tsx` pins both. |
| MDX doc block (`<SlackPreview>`) | ⚠ shipped, **dogfood disabled** | Exported from the package and usable in consumer MDX, but Storybook's `@storybook/addon-docs` MDX preprocessor can't resolve `slack-blocks-to-jsx`'s transitive `emojilib` dep. Consumers may hit the same issue depending on their build. See "Known risks → MDX preprocessor". |
| Addon panel renders the live preview | ⚠ stubbed | The panel shows the validation report, surface, JSON/Builder controls, and block count — but does NOT render the Slack preview itself. Manager-side esbuild bundle can't resolve `emojilib` (transitive through `slack-blocks-to-jsx`). The decorator covers the live preview inline. See "Known risks → Manager-side rendering". |

## Verified locally

These all pass in the scaffold state:

- `pnpm install`
- `pnpm typecheck`
- `pnpm build` → emits `dist/{index,preview,manager,preset}.{js,cjs,d.ts,d.cts}` plus source maps
- `pnpm build-storybook` → produces `storybook-static/`

NOT yet exercised:

- `pnpm storybook` (dev server) — should work because static build does
- External smoke test in a fresh consumer Storybook
- npm publish
- git init / GitHub repo creation / push

## What to do first

1. `pnpm storybook` — open dogfood at `:6007`. Verify:
   - **Decorator/SectionWithButton**: a Slack-style section + button preview renders below the host badge.
   - **Decorator/HeaderDividerContext**: header + section + divider + context preview.
   - **Decorator/PerStoryOverride**: preview is dark even when toolbar theme is light.
   - **Decorator/NoBlocks**: no preview; panel says "set `parameters.slackBlocks`".
   - **Toolbar globals/TogglesLive**: flipping the toolbar dropdowns flips theme + surface on the preview live.
   - **Panel-only/PanelOnly**: no inline preview; the addon panel shows the stub message (until we fix manager rendering).
2. External smoke test in a scratch app:
   - Create a fresh `pnpm create vite@latest scratch && cd scratch && pnpm dlx storybook@latest init`.
   - `pnpm pack` here, `pnpm add ../path/to/the/tgz` in scratch.
   - Add `'@tightknitai/storybook-addon-slack-block-kit'` to `.storybook/main.ts` addons.
   - Write a story with `parameters: { slackBlocks: [...] }` and confirm the preview shows.

## Known risks / brittle areas

### 1. Manager-side rendering (panel is stubbed)

`src/panel.tsx` was originally written to render the same `Renderer` the decorator uses. But Storybook's manager-side esbuild bundle can't resolve `emojilib`'s extensionless `require('./emojis')` calls (the files are `emojis.json` / `ordered.json`). Vite's `optimizeDeps.esbuildOptions.resolveExtensions` doesn't reach the manager bundle.

**Current state**: `src/panel.tsx` is a stub — it reads the parameter and reports the block count, but doesn't render the preview. The decorator (preview-side) does the real rendering.

**Fix paths** (pick one for v1):
- **a)** Render the panel as an `<iframe>` that points to a hidden preview story. Manager bundles stay light; the iframe loads the preview iframe which already has the renderer working.
- **b)** Use `addons.getChannel()` to broadcast the rendered HTML from a preview-side decorator into the manager panel as a string. More plumbing but framework-pure.
- **c)** Patch `emojilib` via pnpm `patches/` so its `index.js` uses `require('./emojis.json')` / `require('./ordered.json')` explicitly. Fixes the root cause but adds a maintenance burden.
- **d)** Submit a PR to `slack-blocks-to-jsx` to drop the `emojilib` dep or vendor the JSON inline. The cleanest long-term option.

### 2. MDX preprocessor (dogfood story disabled)

`stories/DocBlock.mdx` exists and shows the intended consumer usage of `<SlackPreview>`, but is excluded from the dogfood Storybook's `stories` glob in `.storybook/main.ts`. Reason: `@storybook/addon-docs` runs its own esbuild over MDX import graphs at compile time; that esbuild doesn't honor Vite's `viteFinal` and trips over the same emojilib resolution issue.

The same fix paths as (1) above apply. Once emojilib resolves cleanly, re-enable MDX by restoring `'../stories/**/*.mdx'` to the glob in `.storybook/main.ts`.

### 3. Storybook 10 import paths

`src/manager.tsx` and `src/panel.tsx` use:
```ts
import { addons, types } from 'storybook/manager-api';
import { AddonPanel } from 'storybook/internal/components';
import { useParameter } from 'storybook/manager-api';
```

These resolved against `storybook@10.4.0` at scaffold time. If a future minor bump renames them, check `node_modules/storybook/package.json` `exports` for the new subpaths.

### 4. Preset entry resolution

`src/preset.ts` uses `import.meta.url` + `fileURLToPath` to compute `__dirname` and joins to `manager.js` / `preview.js`. tsup produces both ESM and CJS; the ESM build uses `import.meta.url` natively, CJS gets tsup's `__dirname` shim. If Storybook's loader can't find entries, check `dist/preset.js` and `dist/preset.cjs` after build.

### 5. CSS scope coupling

`src/renderer.tsx` mounts blocks under `<div id="slack_blocks_to_jsx" data-theme={theme} className="slack_blocks_to_jsx styles_enabled">`. Required by `slack-blocks-to-jsx`'s CSS scope and theme rules. Do not change.

### 6. Storybook addon catalog discovery

`package.json` has a `storybook` field (`displayName`, `supportedFrameworks`, `icon`). The `icon` URL points at TightknitAI's GitHub avatar — confirm or replace before publishing.

### 7. `parameters.slackBlocks` typing

No module augmentation for `Parameters['slackBlocks']`, so consumer stories type the parameter as `unknown`. Add when you're confident which Storybook 10 module exports `Parameters`:

```ts
// src/storybook.d.ts (NEW)
declare module 'storybook/internal/types' {
  interface Parameters {
    slackBlocks?: import('./types').SlackBlocksParameter;
  }
}
```

## File map

```
storybook-addon-slack-block-kit/
├── AGENTS.md                       ← you are here
├── README.md                       ← user-facing
├── LICENSE                         ← MIT
├── package.json                    ← exports map: . / preview / manager / preset / package.json
├── tsconfig.json
├── tsup.config.ts                  ← 4 entries → dist/{index,preview,manager,preset}.{js,cjs,d.ts}
├── biome.json
├── .gitignore
├── .storybook/
│   ├── main.ts                     ← framework + stories + local-preset + viteFinal
│   ├── preview.ts                  ← minimal; addon source supplies decorator/globals
│   └── local-preset.ts             ← dogfood: wires src/ directly, no build needed
├── src/
│   ├── constants.ts                ← ADDON_ID, PANEL_ID, PARAM_KEY, GLOBAL_* keys
│   ├── globals.d.ts                ← ambient `declare module '*.css'`
│   ├── types.ts                    ← SlackPreview{Theme,Surface,Props}, SlackBlocksParameter, SlackInteractionPayload
│   ├── renderer.tsx                ← Renderer — Slack-styled wrapper around slack-blocks-to-jsx
│   ├── preview-chrome.tsx          ← PreviewToolbar / ValidationBanner / InteractionsPanel (factored out for reuse + testability)
│   ├── validate.ts                 ← validateForSurface — surface→target adapter over @tightknitai/slack-block-kit-validator
│   ├── sanitize.ts                 ← isSafeUrl / sanitizeBlockUrls — URL scheme allowlist applied before every render
│   ├── builder-url.ts              ← buildBlockKitBuilderUrl — wraps blocks in the surface-appropriate envelope and URL-encodes
│   ├── interactions.ts             ← extractInteractions — walks blocks for interactive elements (buttons/selects/etc.)
│   ├── decorator.tsx               ← withSlackPreview — preview-side story decorator (supports bare/object/function param forms)
│   ├── panel.tsx                   ← Panel — validation report + JSON/Builder controls (preview itself is still stubbed; see #1)
│   ├── blocks.tsx                  ← SlackPreview — MDX doc block (re-exports Renderer)
│   ├── manager.tsx                 ← addons.register + addons.add panel
│   ├── preview.ts                  ← decorators + globalTypes + initialGlobals
│   ├── preset.ts                   ← managerEntries + previewAnnotations
│   └── index.ts                    ← public exports
└── stories/
    ├── Decorator.stories.tsx       ← 4 stories incl. dark-pinned + no-blocks empty state
    ├── Toolbar.stories.tsx         ← toolbar globals demo
    ├── Panel.stories.tsx           ← layout: panel-only
    ├── Hooks.stories.tsx           ← user/channel/emoji hook examples
    ├── ArgsDriven.stories.tsx      ← function-form parameter driving blocks from Controls
    ├── AppHome.stories.tsx         ← `home` surface with the tab-strip chrome
    ├── Validation.stories.tsx      ← valid + intentionally-invalid fixtures for the banner
    ├── UrlSafety.stories.tsx       ← safe + hostile URL fixtures for the allowlist
    ├── Interactions.stories.tsx    ← buttons + select with onInteraction wired
    └── DocBlock.mdx                ← PRESERVED but excluded from dogfood discovery
```

## Workflow expectations

- **Don't** publish to npm without explicit user instruction.
- **Don't** push to GitHub or create a remote repo without confirming the URL.
- **Do** run `pnpm storybook` as the first proof of life; the static build already passes.
- **Do** prioritize fixing Known risks #1 + #2 (the emojilib resolution) for v1 — they unblock the panel and MDX.
- **Do** keep `src/preset.ts` and `.storybook/local-preset.ts` in lock-step.

## Roadmap

1. **v1 priority — fix manager rendering**: pick one of the four fix paths in Known risks #1. The iframe approach (a) is the safest; the upstream emojilib drop (d) is the cleanest.
2. **v1 — re-enable MDX dogfood**: once #1 is fixed, restore the MDX glob in `.storybook/main.ts`.
3. **Module augmentation for `Parameters['slackBlocks']`** (#7) so consumer TS stories get typed parameters.
4. **a11y dogfooding**: add `@storybook/addon-a11y` to this repo's own Storybook; verify the renderer output passes axe across the 14 block types the builder catalogs. (Note: the builder's `Image` story currently has an unrelated upstream button-name violation — tracked separately.)
5. **Diff view** (deferred from original plan): side-by-side of the consumer's component output vs. Slack's rendering of the same blocks. Worth revisiting if teams report drift between their factories and Slack's render.
6. **Shared renderer package**: if a third consumer of the renderer shows up (e.g. a docs site), promote `src/renderer.tsx` into a tiny `@tightknitai/slack-block-renderer` package shared by this addon and the builder.

## Where this came from

The parent repo's plan that birthed this work:

```
~/.claude/plans/this-is-a-big-scalable-hollerith.md
```

…on the original machine. The relevant sections are **New repo layout**, **Addon pieces — specifics**, and **Verification**. This scaffold implements that plan with the v0 limitations noted above.
