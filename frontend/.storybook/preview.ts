import type { Preview } from '@storybook/react-webpack5';

import { worker } from '../src/mocks/browser';

const preview: Preview = {
  async beforeAll() {
    await worker.start({
      onUnhandledRequest: 'bypass',
    });

    return () => worker.stop();
  },
  parameters: {
    layout: 'centered',
  },
};

export default preview;
