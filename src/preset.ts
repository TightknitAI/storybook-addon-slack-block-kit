/**
 * Storybook preset entry — intentionally empty.
 *
 * Storybook 10 auto-loads an addon's `./manager` and `./preview` exports
 * when the package `exports` map declares them, which ours does. Adding
 * `dist/manager.js` / `dist/preview.js` again here via `managerEntries` /
 * `previewAnnotations` makes Storybook import them twice, and the preview
 * iframe dies with `Identifier 'preview_<hash>' has already been declared`.
 *
 * The `./preset` export stays so anyone who points at it directly keeps
 * resolving a module. The dogfood Storybook loads `src/` through
 * `.storybook/local-preset.ts` instead, which still needs its entries.
 */
export {};
