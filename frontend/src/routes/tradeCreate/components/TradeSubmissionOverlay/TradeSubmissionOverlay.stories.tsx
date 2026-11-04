import styled from '@emotion/styled';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import TradeSubmissionOverlay from './TradeSubmissionOverlay';

const meta: Meta<typeof TradeSubmissionOverlay> = {
  title: 'routes/trade/TradeSubmissionOverlay',
  component: TradeSubmissionOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <PreviewPage>
        <PreviewHeader>GachiGacha</PreviewHeader>
        <PreviewMain>
          <h1>거래 글쓰기</h1>
          <PreviewPhotos aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <PreviewPhoto key={index} />
            ))}
          </PreviewPhotos>
          <PreviewLabel>제목</PreviewLabel>
          <PreviewField />
          <PreviewLabel>설명</PreviewLabel>
          <PreviewTextarea />
        </PreviewMain>
        <PreviewSubmitButton type="button">등록 중...</PreviewSubmitButton>
        <Story />
      </PreviewPage>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TradeSubmissionOverlay>;

export const Compressing: Story = {
  args: {
    stage: 'compressing',
    action: 'create',
    percentage: 42,
    completedCount: 2,
    totalCount: 5,
  },
};

export const AlmostComplete: Story = {
  args: {
    stage: 'compressing',
    action: 'create',
    percentage: 86,
    completedCount: 4,
    totalCount: 5,
  },
};

export const Uploading: Story = {
  args: {
    stage: 'uploading',
    action: 'create',
  },
};

export const Updating: Story = {
  args: {
    stage: 'uploading',
    action: 'edit',
  },
};

const PreviewPage = styled.div`
  min-height: 100vh;
  background: #ffffff;
`;

const PreviewHeader = styled.header`
  padding: 20px 8vw;
  border-bottom: 1px solid #ececef;
  color: #ed174c;
  font-size: 20px;
  font-weight: 900;
`;

const PreviewMain = styled.main`
  width: min(760px, calc(100% - 40px));
  margin: 0 auto;
  padding: 44px 0 120px;

  h1 {
    margin: 0 0 32px;
    color: #202126;
    font-size: 32px;
  }
`;

const PreviewPhotos = styled.div`
  display: flex;
  margin-bottom: 28px;
  gap: 12px;
`;

const PreviewPhoto = styled.div`
  width: 112px;
  aspect-ratio: 1;
  border-radius: 14px;
  background: linear-gradient(135deg, #f4f4f6, #e5e5e9);
`;

const PreviewLabel = styled.p`
  margin: 18px 0 9px;
  color: #242429;
  font-size: 14px;
  font-weight: 800;
`;

const PreviewField = styled.div`
  height: 52px;
  border-radius: 12px;
  background: #f7f7f8;
`;

const PreviewTextarea = styled(PreviewField)`
  height: 120px;
`;

const PreviewSubmitButton = styled.button`
  position: fixed;
  right: 8vw;
  bottom: 18px;
  left: 8vw;
  height: 52px;
  border: 0;
  border-radius: 12px;
  background: #ed174c;
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
`;
