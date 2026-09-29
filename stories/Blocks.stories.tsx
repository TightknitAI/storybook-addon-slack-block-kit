import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Block } from 'slack-blocks-to-jsx';

import { SlackPreview } from '../src/blocks';

/**
 * Block catalog — one story per block type in Slack's Block Kit reference
 * (https://docs.slack.dev/reference/block-kit/blocks), all 21 of them. Every type
 * except `data_table` is drawn by `slack-blocks-to-jsx`; `data_table` goes through
 * the addon's own translation in `src/normalize.ts`.
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
    surface: { control: { type: 'inline-radio' }, options: ['message', 'modal', 'home'] }
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

// Slack only supports `alert` in modals.
export const Alert: Story = {
  args: {
    surface: 'modal',
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
          type: 'image',
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
    ] as unknown as Block[] // slack-blocks-to-jsx's `CardImage` omits Slack's `type: 'image'`
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
              type: 'image',
              image_url: 'https://placehold.co/400x200/png?text=Slide+1',
              alt_text: 'Slide 1'
            },
            title: { type: 'plain_text', text: 'Slide 1', emoji: true },
            body: { type: 'plain_text', text: 'Swipe horizontally to see more.', emoji: true }
          },
          {
            type: 'card',
            hero_image: {
              type: 'image',
              image_url: 'https://placehold.co/400x200/png?text=Slide+2',
              alt_text: 'Slide 2'
            },
            title: { type: 'plain_text', text: 'Slide 2', emoji: true },
            body: { type: 'plain_text', text: 'Up to 10 cards per carousel.', emoji: true }
          },
          {
            type: 'card',
            hero_image: {
              type: 'image',
              image_url: 'https://placehold.co/400x200/png?text=Slide+3',
              alt_text: 'Slide 3'
            },
            title: { type: 'plain_text', text: 'Slide 3', emoji: true },
            body: { type: 'plain_text', text: 'CSS scroll-snap under the hood.', emoji: true }
          }
        ]
      }
    ] as unknown as Block[] // slack-blocks-to-jsx's `CardImage` omits Slack's `type: 'image'`
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
          text: '`file` blocks can’t be sent by apps — Slack only includes them when you *retrieve* a message that shares a remote file. The validator flags it on every surface, and the preview draws nothing for it, because there’s no file metadata to show.'
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
        title: { type: 'plain_text', text: 'Sample video', emoji: true },
        thumbnail_url: 'https://placehold.co/640x360/png?text=Thumbnail',
        video_url: 'https://www.youtube.com/embed/RRxQQxiM7AA?feature=oembed&autoplay=1',
        alt_text: 'Sample video',
        title_url: 'https://www.youtube.com/watch?v=RRxQQxiM7AA',
        author_name: 'Slack',
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

export const Container: Story = {
  args: {
    blocks: [
      {
        type: 'container',
        title: { type: 'plain_text', text: 'Bulk update: 2 records selected' },
        subtitle: { type: 'plain_text', text: 'Review changes before confirming' },
        is_collapsible: true,
        child_blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: '*DCW-1024*\nStatus: Open → Closed\nAssignee: @alice → @carl' }
          },
          { type: 'divider' },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: '*DCW-1025*\nStatus: In Progress → Closed\nAssignee: @bob → @carl' }
          },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: ':white_check_mark: 2 records will be updated' }]
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Confirm All', emoji: true },
                style: 'primary',
                action_id: 'bulk_confirm'
              },
              { type: 'button', text: { type: 'plain_text', text: 'Cancel', emoji: true }, action_id: 'bulk_cancel' }
            ]
          }
        ]
      },
      {
        type: 'container',
        title: { type: 'plain_text', text: 'Collapsed by default' },
        is_collapsible: true,
        default_collapsed: true,
        child_blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Hidden until expanded.' } }]
      },
      {
        type: 'container',
        title: { type: 'plain_text', text: 'Static, wide' },
        width: 'wide',
        child_blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Not collapsible, `width: wide`.' } }]
      }
    ]
  }
};

export const DataVisualizationPie: Story = {
  name: 'Data visualization (pie)',
  args: {
    blocks: [
      {
        type: 'data_visualization',
        title: 'My Favorite Candy Bars',
        chart: {
          type: 'pie',
          segments: [
            { label: 'Kit Kat', value: 45 },
            { label: 'Twix', value: 28 },
            { label: 'Crunch', value: 18 },
            { label: 'Milky Way', value: 9 }
          ]
        }
      }
    ]
  }
};

export const DataVisualizationBar: Story = {
  name: 'Data visualization (bar)',
  args: {
    blocks: [
      {
        type: 'data_visualization',
        title: 'Pies by Tastiness',
        chart: {
          type: 'bar',
          series: [
            {
              name: 'Pies',
              data: [
                { label: 'Rhubarb', value: 85 },
                { label: 'Pumpkin', value: 70 },
                { label: 'Lemon', value: 72 },
                { label: 'Blueberry', value: 90 },
                { label: 'Key Lime', value: 56 }
              ]
            }
          ],
          axis_config: {
            categories: ['Rhubarb', 'Pumpkin', 'Lemon', 'Blueberry', 'Key Lime'],
            x_label: 'Pies',
            y_label: 'Tastiness (%)'
          }
        }
      }
    ]
  }
};

export const DataVisualizationArea: Story = {
  name: 'Data visualization (area)',
  args: {
    blocks: [
      {
        type: 'data_visualization',
        title: 'Daily Active Users',
        chart: {
          type: 'area',
          series: [
            {
              name: 'Free tier',
              data: [
                { label: 'Mon', value: 12000 },
                { label: 'Tue', value: 13500 },
                { label: 'Wed', value: 15200 },
                { label: 'Thu', value: 14800 },
                { label: 'Fri', value: 16400 }
              ]
            },
            {
              name: 'Paid tier',
              data: [
                { label: 'Mon', value: 4500 },
                { label: 'Tue', value: 4800 },
                { label: 'Wed', value: 5100 },
                { label: 'Thu', value: 5600 },
                { label: 'Fri', value: 6200 }
              ]
            }
          ],
          axis_config: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], x_label: 'Day', y_label: 'Users' }
        }
      }
    ]
  }
};

export const DataVisualizationLine: Story = {
  name: 'Data visualization (line)',
  args: {
    blocks: [
      {
        type: 'data_visualization',
        title: 'Weekly Paper Sales',
        chart: {
          type: 'line',
          series: [
            {
              name: 'Website',
              data: [
                { label: 'Week 1', value: 32000 },
                { label: 'Week 2', value: 35000 },
                { label: 'Week 3', value: 29000 },
                { label: 'Week 4', value: 41000 },
                { label: 'Week 5', value: 45000 }
              ]
            },
            {
              name: 'In-store',
              data: [
                { label: 'Week 1', value: 21000 },
                { label: 'Week 2', value: 19000 },
                { label: 'Week 3', value: 24000 },
                { label: 'Week 4', value: 22000 },
                { label: 'Week 5', value: 27000 }
              ]
            }
          ],
          axis_config: {
            categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            x_label: 'Week',
            y_label: 'Sales (USD)'
          }
        }
      }
    ]
  }
};

// `data_table` and `raw_number` cells aren't in slack-blocks-to-jsx's `Block`
// union yet — the addon translates them itself (see src/normalize.ts).
export const DataTable: Story = {
  args: {
    blocks: [
      {
        type: 'data_table',
        caption: 'Top community members this week',
        page_size: 4,
        rows: [
          [
            { type: 'raw_text', text: 'Member' },
            { type: 'raw_text', text: 'Badge' },
            { type: 'raw_text', text: 'Posts' },
            { type: 'raw_text', text: 'Replies' }
          ],
          [
            { type: 'raw_text', text: 'Alice Chen' },
            {
              type: 'rich_text',
              elements: [
                { type: 'rich_text_section', elements: [{ type: 'text', text: 'Champion', style: { bold: true } }] }
              ]
            },
            { type: 'raw_number', value: 42, text: '42' },
            { type: 'raw_number', value: 118, text: '118' }
          ],
          [
            { type: 'raw_text', text: 'Bob Okafor' },
            { type: 'raw_text', text: 'Helper' },
            { type: 'raw_number', value: 31, text: '31' },
            { type: 'raw_number', value: 96, text: '96' }
          ],
          [
            { type: 'raw_text', text: 'Carla Diaz' },
            {
              type: 'rich_text',
              elements: [
                { type: 'rich_text_section', elements: [{ type: 'text', text: 'Rising', style: { italic: true } }] }
              ]
            },
            { type: 'raw_number', value: 18, text: '18' },
            { type: 'raw_number', value: 1204, text: '1,204' }
          ],
          [
            { type: 'raw_text', text: 'Dev Patel' },
            { type: 'raw_text', text: 'Helper' },
            { type: 'raw_number', value: 12, text: '12' },
            { type: 'raw_number', value: 40, text: '40' }
          ],
          [
            { type: 'raw_text', text: 'Eve Martin' },
            { type: 'raw_text', text: '—' },
            { type: 'raw_number', value: 7, text: '7' },
            { type: 'raw_number', value: 22, text: '22' }
          ]
        ]
      }
    ] as unknown as Block[]
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
