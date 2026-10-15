import { useState } from 'react';
import styled from '@emotion/styled';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { color, shadow } from '@/shared/styles/tokens';

import LandingTour, { type LandingTourStepIndex } from './LandingTour';
import LandingTourSnapshotBackdrop from './LandingTourSnapshotBackdrop';

function LandingTourExample({
  initialStep,
}: {
  initialStep: LandingTourStepIndex;
}) {
  const [stepIndex, setStepIndex] = useState<LandingTourStepIndex>(initialStep);
  const [isOpen, setIsOpen] = useState(true);

  const restartTour = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  const leaveTourForTrade = () => {
    setStepIndex(0);
    setIsOpen(false);
  };

  return (
    <MemoryRouter initialEntries={['/']}>
      <AuthSessionProvider initialAccessToken={null}>
        <div
          aria-hidden={isOpen}
          inert={isOpen ? true : undefined}
          style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
        >
          <LandingTourSnapshotBackdrop stepIndex={stepIndex} />
        </div>

        {isOpen ? (
          <LandingTour
            stepIndex={stepIndex}
            onStepChange={setStepIndex}
            onComplete={leaveTourForTrade}
            onSkip={leaveTourForTrade}
          />
        ) : (
          <RestartButton type="button" onClick={restartTour}>
            랜딩 투어 다시 보기
          </RestartButton>
        )}
      </AuthSessionProvider>
    </MemoryRouter>
  );
}

const RestartButton = styled.button`
  position: fixed;
  z-index: 300;
  right: 20px;
  bottom: 20px;
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: ${color.primary};
  box-shadow: ${shadow.card};
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;
`;

const meta = {
  title: 'routes/landing/LandingTour',
  component: LandingTour,
  args: {
    stepIndex: 0,
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: ({ stepIndex }) => (
    <LandingTourExample initialStep={stepIndex as LandingTourStepIndex} />
  ),
} satisfies Meta<typeof LandingTour>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
