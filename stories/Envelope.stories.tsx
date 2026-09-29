import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Snapshot-ready stories: no host component, just the Slack surface, with
 * the envelope set to match a real app — app name, a pinned timestamp so
 * the screenshot doesn't change between runs, and the modal's own title
 * and button labels. App Home is widened, because Slack's Home tab fills the
 * whole conversation pane (`width: 'full'` fills the canvas instead).
 * Validation, interactions and Copy JSON stay in the Slack Block Kit panel,
 * out of the frame.
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

export const AppHome: Story = {
  parameters: {
    slackBlocks: {
      surface: 'home' as const,
      width: 960,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'Welcome back, Alice 👋' } },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Your community this week*\n12 new members joined and 3 events are coming up. Here’s what needs your attention.'
          },
          accessory: {
            type: 'button',
            style: 'primary',
            text: { type: 'plain_text', text: 'Open dashboard' },
            action_id: 'open_dashboard'
          }
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '*New members*\n12' },
            { type: 'mrkdwn', text: '*Posts*\n48' },
            { type: 'mrkdwn', text: '*Upcoming events*\n3' },
            { type: 'mrkdwn', text: '*Unanswered questions*\n5' }
          ]
        },
        {
          type: 'actions',
          elements: [
            { type: 'button', text: { type: 'plain_text', text: 'Review questions' }, action_id: 'questions' },
            { type: 'button', text: { type: 'plain_text', text: 'Plan an event' }, action_id: 'plan_event' },
            {
              type: 'static_select',
              action_id: 'range',
              placeholder: { type: 'plain_text', text: 'This week' },
              options: [
                { text: { type: 'plain_text', text: 'This week' }, value: 'week' },
                { text: { type: 'plain_text', text: 'This month' }, value: 'month' }
              ]
            }
          ]
        },
        { type: 'context', elements: [{ type: 'mrkdwn', text: 'Updated every morning at 9am · Tightknit' }] }
      ]
    }
  }
};
