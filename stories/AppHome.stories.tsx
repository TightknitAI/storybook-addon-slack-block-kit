import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Exercises the third Slack surface: App Home. Home tabs accept a subset
 * of blocks (no `alert`, `markdown`, `plan`, `task_card` or
 * `context_actions`, and no `file_input` element) and render under the
 * Home / Messages / About tab strip Slack shows for installed apps.
 * Surface-compatibility is enforced by
 * `@tightknitai/slack-block-kit-validator`, so misusing one of those here
 * shows up under "Won't render on App Home" in the addon panel.
 */
function HostNote({ note }: { note: string }) {
  return <p style={{ fontFamily: 'system-ui, sans-serif', color: '#374151', maxWidth: 480 }}>{note}</p>;
}

const meta = {
  title: 'Addon/App Home',
  component: HostNote,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeTab: Story = {
  args: { note: "Pinned to the 'home' surface — preview shows the Home / Messages / About tab strip." },
  parameters: {
    slackBlocks: {
      surface: 'home' as const,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'Welcome to TightknitBot', emoji: true } },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Quick links to get started:'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View dashboard', emoji: true },
              action_id: 'view_dashboard'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Configure', emoji: true },
              action_id: 'configure',
              style: 'primary'
            }
          ]
        }
      ]
    }
  }
};
