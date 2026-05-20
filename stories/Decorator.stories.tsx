import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * A trivial "host component" that the dogfood stories render. The point is
 * to prove the addon's decorator inserts a Slack preview below the story
 * whenever `parameters.slackBlocks` is set. The host component itself can
 * be anything — it's a stand-in for the consumer's design-system component.
 */
function HostBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: '#eef2ff',
        color: '#3730a3',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13
      }}
    >
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
      {label}
    </span>
  );
}

const meta = {
  title: 'Addon/Decorator',
  component: HostBadge,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SectionWithButton: Story = {
  args: { label: 'My component (host)' },
  parameters: {
    slackBlocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Hello from Slack!* This block is rendered by the addon decorator.' },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'Open', emoji: true },
          action_id: 'open'
        }
      }
    ]
  }
};

export const HeaderDividerContext: Story = {
  args: { label: 'Multi-block fixture' },
  parameters: {
    slackBlocks: [
      { type: 'header', text: { type: 'plain_text', text: 'Welcome', emoji: true } },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: 'A *mixed* fixture: header, section, divider, context.' }
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: ':sparkles: Posted by the dogfood story' }]
      }
    ]
  }
};

export const PerStoryOverride: Story = {
  args: { label: 'Story-pinned theme = dark' },
  parameters: {
    slackBlocks: {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'This preview ignores the toolbar theme and is always dark.'
          }
        }
      ],
      theme: 'dark'
    }
  }
};

export const NoBlocks: Story = {
  args: { label: 'No slackBlocks set' }
  // Decorator falls through and just renders the host. Verify the panel
  // shows its empty-state message.
};
