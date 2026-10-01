import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SlackInteractionPayload } from '../src/types';

/**
 * Demonstrates interactions. Click a button in the preview, or open the
 * Slack Block Kit panel, which lists every interactive element it found
 * (buttons, selects, datepickers, etc.) with a "Simulate" button per row.
 * Either fires `parameters.slackBlocks.onInteraction(payload)` with the
 * same shape Slack would post to your `interactivity_endpoint`, and logs
 * the payload to the Actions panel so you can copy it into a handler test.
 */
function HostNote({ note }: { note: string }) {
  return <p style={{ fontFamily: 'system-ui, sans-serif', color: '#374151', maxWidth: 480 }}>{note}</p>;
}

const meta = {
  title: 'Addon/Interactions',
  component: HostNote,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostNote>;

export default meta;
type Story = StoryObj<typeof meta>;

const log = (p: SlackInteractionPayload) => {
  // Mirrors what a real interactivity webhook would call — keeping this
  // wired in the story so the dogfood Storybook is self-documenting.
  // eslint-disable-next-line no-alert
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.info('Simulated', p);
  }
};

export const ButtonsAndSelect: Story = {
  args: {
    note: 'Three interactive elements — click the buttons, or simulate any of them from the Slack Block Kit panel.'
  },
  parameters: {
    slackBlocks: {
      onInteraction: log,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: 'Choose your deploy target:' },
          accessory: {
            type: 'static_select',
            action_id: 'target',
            placeholder: { type: 'plain_text', text: 'Select…' },
            options: [
              { text: { type: 'plain_text', text: 'staging' }, value: 'staging' },
              { text: { type: 'plain_text', text: 'production' }, value: 'production' }
            ]
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Deploy', emoji: true },
              style: 'primary',
              action_id: 'deploy',
              value: 'go'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Cancel', emoji: true },
              action_id: 'cancel'
            }
          ]
        }
      ]
    }
  }
};
