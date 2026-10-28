import type { Preview } from '@storybook/react-webpack5';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { GlobalStyles } from '@/shared/ui/GlobalStyles';

const preview: Preview = {
  decorators: [
    (Story) => (
      <>
        <GlobalStyles />
        <AuthSessionProvider>
          <Story />
        </AuthSessionProvider>
      </>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default preview;
