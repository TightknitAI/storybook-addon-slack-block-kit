import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Demonstrates the URL allowlist. Slack sanitizes URLs server-side before
 * it renders a message; `slack-blocks-to-jsx` does not, so the addon holds
 * every URL in a payload to `http` / `https` / `mailto` before anything
 * reaches an `<a href>` or `<img src>`.
 *
 * The stories below carry deliberately hostile payloads. In each one the
 * link keeps its text but loses its target, the image renders as a broken
 * image, and an amber notice above the preview lists what was dropped.
 */
function HostNote({ note }: { note: string }) {
  return <p style={{ fontFamily: 'system-ui, sans-serif', color: '#374151', maxWidth: 480 }}>{note}</p>;
}

const meta = {
  title: 'Addon/URL safety',
  component: HostNote,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof HostNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SafeLinks: Story = {
  args: { note: 'http, https and mailto links render exactly as Slack shows them.' },
  parameters: {
    slackBlocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '<https://api.slack.com/block-kit|Block Kit docs> · <mailto:hi@example.com|Email us>'
        }
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'link', url: 'https://tightknit.ai', text: 'tightknit.ai' }]
          }
        ]
      }
    ]
  }
};

export const ScriptUrlInRichTextLink: Story = {
  args: { note: 'A rich_text link pointing at javascript: — the label stays, the href does not.' },
  parameters: {
    slackBlocks: [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'link', url: 'javascript:alert(document.domain)', text: 'Click me' }]
          }
        ]
      }
    ]
  }
};

export const ScriptUrlInMrkdwn: Story = {
  args: {
    note: 'Slack mrkdwn spells links inside the text, so this one is caught at render time rather than in the payload.'
  },
  parameters: {
    slackBlocks: [{ type: 'section', text: { type: 'mrkdwn', text: '<javascript:alert(1)|Reset your password>' } }]
  }
};

export const ScriptUrlInImage: Story = {
  args: { note: 'Image URLs land in both an <img src> and an <a href>, so they get the same treatment.' },
  parameters: {
    slackBlocks: [{ type: 'image', image_url: 'javascript:alert(1)', alt_text: 'Not loaded' }]
  }
};
