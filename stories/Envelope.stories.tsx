import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Snapshot-ready stories: no host component, just the Slack surface, with
 * the envelope set to match a real app — app name, a pinned timestamp so
 * the screenshot doesn't change between runs, and the modal's own title
 * and button labels. Validation, interactions and Copy JSON stay in the
 * Slack Block Kit panel, out of the frame.
 */
const meta = {
  title: 'Addon/Envelope',
  render: () => <></>,
  parameters: { layout: 'padded' }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TIME = '2026-09-29T15:04:00Z';

export const Message: Story = {
  parameters: {
    slackBlocks: {
      name: 'Tightknit',
      time: TIME,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: ':wave: *Welcome to the community, Alice!* Here’s how to get started.' }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              style: 'primary',
              text: { type: 'plain_text', text: 'Introduce yourself' },
              action_id: 'intro'
            },
            { type: 'button', text: { type: 'plain_text', text: 'Browse events' }, action_id: 'events' }
          ]
        }
      ]
    }
  }
};

export const Modal: Story = {
  parameters: {
    slackBlocks: {
      surface: 'modal' as const,
      modal: { title: 'Invite teammates', submit: 'Send invites', close: 'Not now' },
      blocks: [
        {
          type: 'input',
          label: { type: 'plain_text', text: 'Who should we invite?' },
          element: {
            type: 'multi_users_select',
            action_id: 'invitees',
            placeholder: { type: 'plain_text', text: 'Pick people' }
          }
        },
        {
          type: 'input',
          optional: true,
          label: { type: 'plain_text', text: 'Personal note' },
          element: { type: 'plain_text_input', action_id: 'note', multiline: true }
        }
      ]
    }
  }
};
