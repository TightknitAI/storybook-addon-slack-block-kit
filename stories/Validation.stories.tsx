import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Demonstrates live validation. The addon runs every preview through
 * `@tightknitai/slack-block-kit-validator`; the Slack Block Kit panel shows
 * the full report and its tab carries the issue count.
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
  args: { note: 'Healthy payload — no issue count on the Slack Block Kit panel.' },
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

const nameInput = {
  type: 'input',
  label: { type: 'plain_text', text: 'Name' },
  element: { type: 'plain_text_input', action_id: 'name' }
};

const fileInput = {
  type: 'input',
  label: { type: 'plain_text', text: 'Attachments' },
  element: { type: 'file_input', action_id: 'files' }
};

// The stories below pin `surface` so each one shows its verdict without
// touching the toolbar. The preview still draws every block — Slack's
// surface rules only show up in the addon panel.

export const InputFormOnModal: Story = {
  args: { note: 'Input blocks in a modal — valid. The modal envelope carries `submit`, as Slack requires.' },
  parameters: {
    slackBlocks: { surface: 'modal', blocks: [nameInput, fileInput] }
  }
};

export const FileInputOnAppHome: Story = {
  args: { note: '`file_input` only works in modals — flagged under "Won\'t render on App Home".' },
  parameters: {
    slackBlocks: { surface: 'home', blocks: [nameInput, fileInput] }
  }
};

export const AlertOnMessage: Story = {
  args: { note: 'Alert blocks are modal-only — flagged on the message surface.' },
  parameters: {
    slackBlocks: {
      surface: 'message',
      blocks: [{ type: 'alert', level: 'warning', text: { type: 'mrkdwn', text: 'Heads up' } }]
    }
  }
};

export const MarkdownOnModal: Story = {
  args: { note: 'Markdown blocks are message-only — flagged on the modal surface.' },
  parameters: {
    slackBlocks: { surface: 'modal', blocks: [{ type: 'markdown', text: '**Bold** and _italic_' }] }
  }
};

export const SurfaceAndSchemaErrors: Story = {
  args: {
    note: "A malformed section plus an App Home–incompatible block. Both show up, grouped separately — the schema error doesn't hide the surface one."
  },
  parameters: {
    slackBlocks: {
      surface: 'home',
      blocks: [{ type: 'section' }, { type: 'markdown', text: 'Only in messages' }]
    }
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
