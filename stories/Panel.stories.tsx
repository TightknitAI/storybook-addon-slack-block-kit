import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Proves the addon panel can be the sole render target via
 * `layout: 'panel-only'`. The story body is just instructions — the
 * Slack preview should appear in the "Slack preview" panel, not inline.
 */
function HostInstructions() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        color: '#374151',
        maxWidth: 480,
        padding: 16,
        border: '1px dashed #d1d5db',
        borderRadius: 8
      }}
    >
      <strong>Look at the "Slack preview" addon panel</strong> — the preview is rendered there only, not inline.
    </div>
  );
}

const meta = {
  title: 'Addon/Panel-only',
  component: HostInstructions,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostInstructions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PanelOnly: Story = {
  parameters: {
    slackBlocks: {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Rendered *only* in the addon panel via `layout: "panel-only"`.'
          }
        }
      ],
      layout: 'panel-only'
    }
  }
};
