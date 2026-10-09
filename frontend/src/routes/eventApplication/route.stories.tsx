import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { EventApplicationRoute } from './route';

const meta = {
  title: 'Routes/EventApplication',
  component: EventApplicationRoute,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    config: {
      enabled: true,
      endpoint: 'https://script.google.com/macros/s/storybook/exec',
      startAt: '2026-10-01T00:00:00+09:00',
      endAt: '2026-11-01T00:00:00+09:00',
    },
    now: new Date('2026-10-10T12:00:00+09:00'),
    submitApplication: async () => undefined,
  },
} satisfies Meta<typeof EventApplicationRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: {
    now: new Date('2026-11-02T00:00:00+09:00'),
  },
};
