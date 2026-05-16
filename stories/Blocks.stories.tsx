import type { Meta, StoryObj } from '@storybook/react-vite';

import { SlackPreview } from '../src/blocks';

/**
 * Block catalog — one story per Block Kit block type rendered by
 * `slack-blocks-to-jsx@1.0.4`. Mirrors the 14 blocks `@tightknitai/block-kit-builder`
 * catalogs (section, header, divider, context, actions, image, markdown, rich_text,
 * table, alert, card, carousel, context_actions, input) plus the four extra blocks
 * the renderer supports out of the box (file, video, plan, task_card).
 *
 * Each story passes a single block in `args.blocks`, so the Controls panel doubles
 * as a JSON inspector. KitchenSink composes many blocks at once to verify they
 * coexist on a single surface.
 */
const meta = {
  title: 'Slack Blocks',
  component: SlackPreview,
  // Opt the catalog out of the decorator — `SlackPreview` already renders
  // a preview from `args.blocks`, so the auto-fallback in `withSlackPreview`
  // would draw a second copy below the first.
  parameters: { layout: 'padded', slackBlocks: false },
  argTypes: {
    theme: { control: { type: 'inline-radio' }, options: ['light', 'dark'] },
    surface: { control: { type: 'inline-radio' }, options: ['message', 'modal', 'app_home'] }
  }
} satisfies Meta<typeof SlackPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Section: Story = {
  args: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Section* with an accessory button. Sections are the workhorse block — markdown text plus an optional accessory element.'
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'Open', emoji: true },
          action_id: 'open'
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: '*Priority*\nHigh' },
          { type: 'mrkdwn', text: '*Owner*\n@alice' },
          { type: 'mrkdwn', text: '*Status*\nIn review' },
          { type: 'mrkdwn', text: '*Due*\nFri' }
        ]
      }
    ]
  }
};

export const Header: Story = {
  args: {
    blocks: [{ type: 'header', text: { type: 'plain_text', text: 'Header block', emoji: true } }]
  }
};

export const Divider: Story = {
  args: {
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: 'Above the divider.' } },
      { type: 'divider' },
      { type: 'section', text: { type: 'mrkdwn', text: 'Below the divider.' } }
    ]
  }
};

export const Context: Story = {
  args: {
    blocks: [
      {
        type: 'context',
        elements: [
          {
            type: 'image',
            image_url: 'https://placehold.co/40x40/png',
            alt_text: 'avatar'
          },
          { type: 'mrkdwn', text: '*@alice* posted in <#C123|general> · 2 min ago' }
        ]
      }
    ]
  }
};

export const Actions: Story = {
  args: {
    blocks: [
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Approve', emoji: true },
            style: 'primary',
            action_id: 'approve'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject', emoji: true },
            style: 'danger',
            action_id: 'reject'
          },
          {
            type: 'static_select',
            placeholder: { type: 'plain_text', text: 'Pick a priority', emoji: true },
            options: [
              { text: { type: 'plain_text', text: 'High', emoji: true }, value: 'high' },
              { text: { type: 'plain_text', text: 'Medium', emoji: true }, value: 'med' },
              { text: { type: 'plain_text', text: 'Low', emoji: true }, value: 'low' }
            ],
            action_id: 'priority'
          },
          {
            type: 'datepicker',
            initial_date: '2026-05-15',
            placeholder: { type: 'plain_text', text: 'Pick a date', emoji: true },
            action_id: 'due'
          }
        ]
      }
    ]
  }
};

export const Image: Story = {
  args: {
    blocks: [
      {
        type: 'image',
        title: { type: 'plain_text', text: 'A placeholder image', emoji: true },
        image_url: 'https://placehold.co/600x300/png',
        alt_text: 'Placeholder'
      }
    ]
  }
};

export const Markdown: Story = {
  args: {
    blocks: [
      {
        type: 'markdown',
        text: [
          '# Markdown block',
          '',
          'Renders **standard** GFM via `react-markdown` — not Slack mrkdwn.',
          '',
          '- Lists',
          '- Tables',
          '- `inline code`',
          '',
          '```ts',
          // biome-ignore lint/suspicious/noTemplateCurlyInString: example code rendered inside a markdown fence — not a real placeholder
          'const greet = (name: string) => `Hello, ${name}!`;',
          '```'
        ].join('\n')
      }
    ]
  }
};

export const RichText: Story = {
  args: {
    blocks: [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'text', text: 'A ' },
              { type: 'text', text: 'rich_text', style: { code: true } },
              { type: 'text', text: ' block can mix ' },
              { type: 'text', text: 'bold', style: { bold: true } },
              { type: 'text', text: ', ' },
              { type: 'text', text: 'italic', style: { italic: true } },
              { type: 'text', text: ', ' },
              { type: 'text', text: 'strike', style: { strike: true } },
              { type: 'text', text: ', and ' },
              { type: 'link', url: 'https://slack.com', text: 'links' },
              { type: 'text', text: '.' }
            ]
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            elements: [
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: 'Bullet one' }]
              },
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: 'Bullet two' }]
              }
            ]
          },
          {
            type: 'rich_text_quote',
            elements: [{ type: 'text', text: 'A blockquote inside rich_text.' }]
          },
          {
            type: 'rich_text_preformatted',
            elements: [{ type: 'text', text: '$ rg "rich_text" --type ts' }]
          }
        ]
      }
    ]
  }
};

export const Table: Story = {
  args: {
    blocks: [
      {
        type: 'table',
        rows: [
          [
            { type: 'raw_text', text: 'Service' },
            { type: 'raw_text', text: 'Status' },
            { type: 'raw_text', text: 'P95' }
          ],
          [
            { type: 'raw_text', text: 'api' },
            { type: 'raw_text', text: 'OK' },
            { type: 'raw_text', text: '120ms' }
          ],
          [
            { type: 'raw_text', text: 'web' },
            { type: 'raw_text', text: 'OK' },
            { type: 'raw_text', text: '210ms' }
          ],
          [
            { type: 'raw_text', text: 'worker' },
            { type: 'raw_text', text: 'Degraded' },
            { type: 'raw_text', text: '3.1s' }
          ]
        ]
      }
    ]
  }
};

export const Alert: Story = {
  args: {
    blocks: [
      { type: 'alert', text: { type: 'mrkdwn', text: 'Build *#4821* passed on `main`.' }, level: 'success' },
      { type: 'alert', text: { type: 'mrkdwn', text: 'Cache hit rate dropped to 41%.' }, level: 'info' },
      { type: 'alert', text: { type: 'mrkdwn', text: 'API latency P95 above 1s.' }, level: 'warning' },
      { type: 'alert', text: { type: 'mrkdwn', text: 'Deploy *#4822* failed: smoke test timeout.' }, level: 'error' }
    ]
  }
};

export const Card: Story = {
  args: {
    blocks: [
      {
        type: 'card',
        hero_image: {
          image_url: 'https://placehold.co/600x240/png',
          alt_text: 'Card hero'
        },
        title: { type: 'plain_text', text: 'Card block', emoji: true },
        subtitle: { type: 'plain_text', text: 'A rich container', emoji: true },
        body: {
          type: 'mrkdwn',
          text: 'Cards combine an image, title, subtitle, body, and up to five action buttons in a single block.'
        },
        actions: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Primary', emoji: true },
            style: 'primary',
            action_id: 'primary'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Secondary', emoji: true },
            action_id: 'secondary'
          }
        ]
      }
    ]
  }
};

export const Carousel: Story = {
  args: {
    blocks: [
      {
        type: 'carousel',
        elements: [
          {
            type: 'card',
            hero_image: {
              image_url: 'https://placehold.co/400x200/png?text=Slide+1',
              alt_text: 'Slide 1'
            },
            title: { type: 'plain_text', text: 'Slide 1', emoji: true },
            body: { type: 'plain_text', text: 'Swipe horizontally to see more.', emoji: true }
          },
          {
            type: 'card',
            hero_image: {
              image_url: 'https://placehold.co/400x200/png?text=Slide+2',
              alt_text: 'Slide 2'
            },
            title: { type: 'plain_text', text: 'Slide 2', emoji: true },
            body: { type: 'plain_text', text: 'Up to 10 cards per carousel.', emoji: true }
          },
          {
            type: 'card',
            hero_image: {
              image_url: 'https://placehold.co/400x200/png?text=Slide+3',
              alt_text: 'Slide 3'
            },
            title: { type: 'plain_text', text: 'Slide 3', emoji: true },
            body: { type: 'plain_text', text: 'CSS scroll-snap under the hood.', emoji: true }
          }
        ]
      }
    ]
  }
};

export const ContextActions: Story = {
  args: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Here is an AI-generated response. Was it useful? `context_actions` typically sits below.'
        }
      },
      {
        type: 'context_actions',
        elements: [
          {
            type: 'feedback_buttons',
            positive_button: { text: { type: 'plain_text', text: 'Good Response' }, value: 'up' },
            negative_button: { text: { type: 'plain_text', text: 'Bad Response' }, value: 'down' },
            action_id: 'feedback'
          },
          {
            type: 'icon_button',
            icon: 'trash',
            text: { type: 'plain_text', text: 'Remove' },
            action_id: 'remove'
          }
        ]
      }
    ]
  },
  parameters: { surface: 'message' }
};

export const Input: Story = {
  args: {
    surface: 'modal',
    blocks: [
      {
        type: 'input',
        label: { type: 'plain_text', text: 'Name', emoji: true },
        element: {
          type: 'plain_text_input',
          action_id: 'name',
          placeholder: { type: 'plain_text', text: 'Enter your name', emoji: true }
        }
      },
      {
        type: 'input',
        label: { type: 'plain_text', text: 'Email', emoji: true },
        element: {
          type: 'email_text_input',
          action_id: 'email',
          placeholder: { type: 'plain_text', text: 'name@example.com', emoji: true }
        }
      },
      {
        type: 'input',
        label: { type: 'plain_text', text: 'Priority', emoji: true },
        element: {
          type: 'radio_buttons',
          action_id: 'priority',
          options: [
            { text: { type: 'plain_text', text: 'High', emoji: true }, value: 'high' },
            { text: { type: 'plain_text', text: 'Medium', emoji: true }, value: 'med' },
            { text: { type: 'plain_text', text: 'Low', emoji: true }, value: 'low' }
          ]
        }
      },
      {
        type: 'input',
        label: { type: 'plain_text', text: 'Attachments', emoji: true },
        element: {
          type: 'file_input',
          action_id: 'files',
          filetypes: ['png', 'jpg', 'pdf'],
          max_files: 3
        }
      }
    ]
  }
};

export const File: Story = {
  args: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '`file` blocks render a remote-file attachment. Slack only resolves them when posted via the API with a valid `external_id`; in a static preview the block falls back to a placeholder card.'
        }
      },
      {
        type: 'file',
        external_id: 'EX_FILE_123',
        source: 'remote'
      }
    ]
  }
};

export const Video: Story = {
  args: {
    blocks: [
      {
        type: 'video',
        title: { type: 'plain_text', text: 'Big Buck Bunny', emoji: true },
        thumbnail_url: 'https://placehold.co/640x360/png?text=Thumbnail',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        alt_text: 'Big Buck Bunny (sample video)',
        title_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        author_name: 'Blender Foundation',
        provider_name: 'Sample',
        description: { type: 'plain_text', text: 'A neutral sample video clip.', emoji: true }
      }
    ]
  }
};

export const Plan: Story = {
  args: {
    blocks: [
      {
        type: 'plan',
        title: 'Ship the addon',
        tasks: [
          {
            type: 'task_card',
            task_id: 'scaffold',
            title: 'Scaffold the package',
            status: 'complete'
          },
          {
            type: 'task_card',
            task_id: 'catalog',
            title: 'Add a story per block type',
            status: 'in_progress'
          },
          {
            type: 'task_card',
            task_id: 'publish',
            title: 'Publish to npm',
            status: 'pending'
          }
        ]
      }
    ]
  }
};

export const TaskCard: Story = {
  args: {
    blocks: [
      {
        type: 'task_card',
        task_id: 'task-1',
        title: 'Investigate the auth regression',
        status: 'in_progress',
        details: {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                { type: 'text', text: 'Reproducing locally with ' },
                { type: 'text', text: 'pnpm dev', style: { code: true } },
                { type: 'text', text: ' against the staging DB.' }
              ]
            }
          ]
        }
      }
    ]
  }
};

export const KitchenSink: Story = {
  name: 'Kitchen sink (all blocks together)',
  args: {
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: 'Weekly digest', emoji: true } },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: ':sparkles: posted by *Digest bot* · just now' }]
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*This addon catalogs every block type Slack renders.* Use the sidebar to inspect each one in isolation.'
        }
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_list',
            style: 'bullet',
            elements: [
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: '14 from the builder' }]
              },
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: '+ file, video, plan, task_card' }]
              }
            ]
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open builder', emoji: true },
            style: 'primary',
            action_id: 'builder'
          }
        ]
      }
    ]
  }
};
