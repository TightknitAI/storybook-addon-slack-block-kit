import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Demonstrates the function form of `parameters.slackBlocks` — the
 * blocks are derived from the story's args so Storybook Controls drive
 * the preview live. This is the closest the addon gets to a native
 * Storybook "tweak args, watch the preview update" loop.
 *
 * Try editing the `title` / `body` / `buttonLabel` args in the Controls
 * panel: each change flips the Slack preview without a remount.
 */
interface ArgsDrivenArgs {
  title: string;
  body: string;
  buttonLabel: string;
}

function HostStub({ title }: ArgsDrivenArgs) {
  return (
    <p style={{ fontFamily: 'system-ui, sans-serif', color: '#374151', maxWidth: 480 }}>
      Host renders the title <strong>{title}</strong>. Open the Controls panel and edit any field.
    </p>
  );
}

const meta = {
  title: 'Addon/Args-driven',
  component: HostStub,
  args: {
    title: 'Deploy ready for review',
    body: 'PR #1234 is green. _Click below to deploy._',
    buttonLabel: 'Deploy'
  },
  parameters: {
    layout: 'centered',
    slackBlocks: (args: Record<string, unknown>) => {
      const a = args as unknown as ArgsDrivenArgs;
      return [
        { type: 'header', text: { type: 'plain_text', text: a.title, emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: a.body } },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: a.buttonLabel, emoji: true },
              style: 'primary',
              action_id: 'deploy'
            }
          ]
        }
      ];
    }
  }
} satisfies Meta<typeof HostStub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TweakInControls: Story = {};
