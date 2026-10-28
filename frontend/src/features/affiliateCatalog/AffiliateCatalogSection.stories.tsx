import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { AffiliateCatalogSection } from './AffiliateCatalogSection';

const meta = {
  title: 'features/affiliateCatalog/AffiliateCatalogSection',
  component: AffiliateCatalogSection,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <main
        style={{
          minHeight: '100dvh',
          padding: '40px 24px',
          background: '#ffffff',
        }}
      >
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof AffiliateCatalogSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ChiikawaSearchCatalog: Story = {
  args: {
    categoryName: '치이카와',
    placementPath: '/search',
  },
};
