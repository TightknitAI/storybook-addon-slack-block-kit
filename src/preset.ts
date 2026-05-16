import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Storybook preset entry. `managerEntries` wires the manager-side
 * registration (the panel) and `previewAnnotations` wires the preview-side
 * decorator + global types. Storybook calls these as it builds its merged
 * manager/preview bundles.
 *
 * The paths are resolved relative to *this* compiled file's location
 * (i.e. `dist/preset.js`), so they line up with tsup's output siblings
 * `dist/manager.js` and `dist/preview.js`.
 *
 * Storybook 10 loads the ESM build via the package `exports` map; the
 * matching dist/preset.cjs handles legacy CJS consumers via tsup's
 * `__dirname` shim.
 */
const here = dirname(fileURLToPath(import.meta.url));

export const managerEntries = async (entry: string[] = []): Promise<string[]> => [...entry, join(here, 'manager.js')];

export const previewAnnotations = async (entry: string[] = []): Promise<string[]> => [
  ...entry,
  join(here, 'preview.js')
];
