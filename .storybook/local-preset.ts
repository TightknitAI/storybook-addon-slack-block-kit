import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Dogfooding preset. Wires the addon's source files directly into THIS
 * repo's Storybook so we can iterate without `pnpm build`. When published,
 * consumers list `'@tightknitai/storybook-addon-slack-block-kit'` in their
 * `.storybook/main.ts` addons and Storybook resolves the package's
 * `./preset` export to the built `dist/preset.js` instead.
 *
 * Keep this in lock-step with `src/preset.ts` — same exports, source paths.
 */
const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src');

export const managerEntries = async (entry: string[] = []): Promise<string[]> => [
  ...entry,
  join(SRC, 'manager.tsx')
];

export const previewAnnotations = async (entry: string[] = []): Promise<string[]> => [
  ...entry,
  join(SRC, 'preview.ts')
];
