import { AddonPanel } from 'storybook/internal/components';
import { addons, types } from 'storybook/manager-api';
import { ADDON_ID, PANEL_ID } from './constants';
import { Panel } from './panel';

/**
 * Manager-side entry. Registers the addon and its panel with the Storybook
 * manager UI. Storybook calls this once per session when the addon is
 * loaded via `preset.ts`'s `managerEntries`.
 *
 * Toolbar globals are NOT registered here — they live in `preview.ts`'s
 * `globalTypes` export so they can be picked up by the preview iframe.
 */
addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Slack preview',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => (
      <AddonPanel active={!!active}>
        <Panel />
      </AddonPanel>
    )
  });
});
