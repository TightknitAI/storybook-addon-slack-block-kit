import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Demonstrates the `hooks` API for replacing Slack mention/emoji/date
 * tokens with custom React nodes. Slack's wire format references users
 * and channels by ID (`<@U123>`, `<#C456>`); `slack-blocks-to-jsx`
 * surfaces those as hook calls so consumers can resolve them against
 * their own directory.
 *
 * The hooks below render simple chips with names instead of the raw IDs
 * — what you'd typically do when previewing how a message will read once
 * Slack has rehydrated mentions for the viewing user.
 */
function HostNote({ note }: { note: string }) {
  return <p style={{ fontFamily: 'system-ui, sans-serif', color: '#374151', maxWidth: 480 }}>{note}</p>;
}

const meta = {
  title: 'Addon/Hooks',
  component: HostNote,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostNote>;

export default meta;
type Story = StoryObj<typeof meta>;

const chip = (color: string, label: string) => (
  <span
    style={{
      display: 'inline-block',
      padding: '0 6px',
      borderRadius: 4,
      background: color,
      color: '#0b3a91',
      fontWeight: 500
    }}
  >
    {label}
  </span>
);

export const UserAndChannelMentions: Story = {
  args: { note: 'Hooks resolve <@U123> and <#C456> to friendly chips.' },
  parameters: {
    slackBlocks: {
      blocks: [
        {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                { type: 'text', text: 'Heads up ' },
                { type: 'user', user_id: 'U123' },
                { type: 'text', text: ' — please review in ' },
                { type: 'channel', channel_id: 'C456' },
                { type: 'text', text: '.' }
              ]
            }
          ]
        }
      ],
      hooks: {
        user: ({ user_id }: { user_id: string }) => chip('#dbeafe', user_id === 'U123' ? '@avery' : `@${user_id}`),
        channel: ({ channel_id }: { channel_id: string }) =>
          chip('#dbeafe', channel_id === 'C456' ? '#design-reviews' : `#${channel_id}`)
      }
    }
  }
};

export const EmojiHook: Story = {
  args: { note: 'Emoji hook can swap :sparkles: for a custom node.' },
  parameters: {
    slackBlocks: {
      blocks: [
        {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                { type: 'text', text: 'Custom emoji: ' },
                { type: 'emoji', name: 'sparkles' }
              ]
            }
          ]
        }
      ],
      hooks: {
        emoji: ({ name }: { name: string }, parse: (data: { name: string }) => string) =>
          name === 'sparkles' ? '✨ (custom)' : parse({ name })
      }
    }
  }
};
