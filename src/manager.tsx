import { createElement } from 'react';
import { AddonPanel } from 'storybook/internal/components';
import { addons, types } from 'storybook/manager-api';
import { ADDON_ID, PANEL_ID } from './constants';
import { Panel } from './panel';

/**
 * Manager-side entry. Registers the addon and its panel with the Storybook
 * manager UI. Storybook calls this once per session when the addon is
 * loaded via `preset.ts`'s `managerEntries`.
 *
 * The render callback uses `createElement` directly rather than JSX. The
 * Storybook 10 manager bundle externalizes `react` as the `__REACT__`
 * global, but its esbuild pipeline still emits classic `React.createElement(…)`
 * calls for JSX without putting `React` in scope — which crashes at panel
 * mount. Calling `createElement` explicitly sidesteps the transform
 * entirely. `src/panel.tsx` follows the same convention for the same
 * reason. The published tsup build, by contrast, uses the automatic JSX
 * runtime, so consumers never see this.
 *
 * Toolbar globals are NOT registered here — they live in `preview.ts`'s
 * `globalTypes` export so they can be picked up by the preview iframe.
 */
addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Slack preview',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => createElement(AddonPanel, { active: !!active, children: createElement(Panel) } as never)
  });
});
