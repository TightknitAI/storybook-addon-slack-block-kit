import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Demonstrates that flipping the toolbar's `Slack theme` and
 * `Slack surface` dropdowns re-renders the preview live. Open any story
 * below and toggle the toolbar — the preview should flip without a reload.
 */
function HostNote({ note }: { note: string }) {
  return (
    <p style={{ fontFamily: 'system-ui, sans-serif', color: '#374151', maxWidth: 480 }}>{note}</p>
  );
}

const meta = {
  title: 'Addon/Toolbar globals',
  component: HostNote,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostNote>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE = [
  { type: 'header', text: { type: 'plain_text', text: 'Toolbar demo', emoji: true } },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Flip the *Slack theme* and *Slack surface* dropdowns in the toolbar above.'
    }
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Primary', emoji: true },
        style: 'primary',
        action_id: 'p'
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Danger', emoji: true },
        style: 'danger',
        action_id: 'd'
      }
    ]
  }
];

export const TogglesLive: Story = {
  args: { note: 'Use the Storybook toolbar dropdowns to flip theme + surface.' },
  parameters: { slackBlocks: SAMPLE }
};
