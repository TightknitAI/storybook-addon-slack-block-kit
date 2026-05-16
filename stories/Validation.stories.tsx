import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Demonstrates the live validation banner. The addon runs every preview
 * through `@tightknitai/slack-block-kit-validator` and shows findings
 * inline (above the preview) and in the addon panel (full report).
 *
 * The "Invalid" stories below intentionally violate documented Slack
 * rules so you can watch the validator catch them at story-time.
 */
function HostNote({ note }: { note: string }) {
  return <p style={{ fontFamily: 'system-ui, sans-serif', color: '#374151', maxWidth: 480 }}>{note}</p>;
}

const meta = {
  title: 'Addon/Validation',
  component: HostNote,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Valid: Story = {
  args: { note: 'Healthy payload — green banner, no panel errors.' },
  parameters: {
    slackBlocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*All good*' } }, { type: 'divider' }]
  }
};

export const DuplicateBlockIds: Story = {
  args: { note: 'Two blocks share block_id="x" — Slack will reject this.' },
  parameters: {
    slackBlocks: [
      { type: 'divider', block_id: 'x' },
      { type: 'divider', block_id: 'x' }
    ]
  }
};

export const TableOnModalSurface: Story = {
  args: {
    note: 'Table blocks are rejected on the modal surface — flip the toolbar to "Modal" to see the panel light up red.'
  },
  parameters: {
    slackBlocks: [
      {
        type: 'table',
        rows: [[{ type: 'rich_text', elements: [] }]]
      }
    ]
  }
};

export const ButtonTextTooLong: Story = {
  args: { note: 'Button text > 75 chars — schema catches the maxLength.' },
  parameters: {
    slackBlocks: [
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            action_id: 'too_long',
            text: {
              type: 'plain_text',
              text: 'x'.repeat(80)
            }
          }
        ]
      }
    ]
  }
};
