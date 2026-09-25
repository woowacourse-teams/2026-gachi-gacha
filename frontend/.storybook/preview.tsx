import type { Preview } from '@storybook/react-webpack5';

import { GlobalStyles } from '@/shared/ui/GlobalStyles';

const preview: Preview = {
  decorators: [
    (Story) => (
      <>
        <GlobalStyles />
        <Story />
      </>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default preview;
