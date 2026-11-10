import type { Preview } from '@storybook/react-webpack5';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { GlobalStyles } from '@/shared/ui/GlobalStyles';
import { ToastProvider } from '@/shared/ui/toast';

const preview: Preview = {
  decorators: [
    (Story) => (
      <>
        <GlobalStyles />
        <AuthSessionProvider>
          <ToastProvider>
            <Story />
          </ToastProvider>
        </AuthSessionProvider>
      </>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default preview;
