import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  clearAccessToken,
  storeAccessToken,
} from '@/features/auth/authTokenStorage';
import { AUTH_STORY_TOKEN } from '@/features/auth/mocks/authHandlers';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { SupportInquiryDialog } from './SupportInquiryDialog';
import { supportInquirySuccessHandler } from '../mocks/myPageHandlers';

function DialogStory() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    storeAccessToken(AUTH_STORY_TOKEN);

    return () => {
      clearAccessToken();
    };
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: 32 }}>
      <button type="button" onClick={() => setOpen(true)}>
        고객센터 열기
      </button>
      <SupportInquiryDialog open={open} onClose={() => setOpen(false)} />
    </main>
  );
}

const meta = {
  title: 'Routes/MyPage/SupportInquiryDialog',
  component: SupportInquiryDialog,
  args: {
    open: true,
    onClose: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <MockWorkerBoundary handlers={[supportInquirySuccessHandler]}>
      <DialogStory />
    </MockWorkerBoundary>
  ),
} satisfies Meta<typeof SupportInquiryDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
