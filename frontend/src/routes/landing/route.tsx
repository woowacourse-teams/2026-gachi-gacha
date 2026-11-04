import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import {
  hasSeenCurrentLandingTour,
  LANDING_TOUR_VERSION,
  markCurrentLandingTourAsSeen,
} from '@/features/onboarding/landingTourSeenStorage';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import LandingTour, {
  LANDING_TOUR_STEPS,
  type LandingTourStepIndex,
} from './LandingTour';
import LandingTourSnapshotBackdrop from './LandingTourSnapshotBackdrop';

const ENTRY_PATH = '/trade';

interface EntryRedirectProps {
  hash: string;
  rememberAsSeen: boolean;
  search: string;
}

function EntryRedirect({ hash, rememberAsSeen, search }: EntryRedirectProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (rememberAsSeen) {
      markCurrentLandingTourAsSeen();
    }

    navigate(
      {
        pathname: ENTRY_PATH,
        search,
        hash,
      },
      { replace: true },
    );
  }, [hash, navigate, rememberAsSeen, search]);

  return <PageLoadingFallback label="서비스를 시작하고 있어요." />;
}

export function LandingRoute() {
  const { status } = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState<LandingTourStepIndex>(0);
  const hasSeenLandingTour = hasSeenCurrentLandingTour();

  useEffect(() => {
    if (status !== 'guest' || hasSeenLandingTour) {
      return;
    }

    captureAnalyticsEvent('landing_tour_step_viewed', {
      tour_version: LANDING_TOUR_VERSION,
      step_number: stepIndex + 1,
      target: LANDING_TOUR_STEPS[stepIndex].target,
    });
  }, [hasSeenLandingTour, status, stepIndex]);

  if (status === 'loading') {
    return <PageLoadingFallback label="로그인 상태를 확인하고 있어요." />;
  }

  if (status === 'authenticated' || hasSeenLandingTour) {
    return (
      <EntryRedirect
        hash={location.hash}
        rememberAsSeen={status === 'authenticated'}
        search={location.search}
      />
    );
  }

  const enterService = (
    exitType: 'completed' | 'skip_button' | 'close_button',
  ) => {
    captureAnalyticsEvent('landing_tour_exited', {
      tour_version: LANDING_TOUR_VERSION,
      exit_type: exitType,
      last_step_number: stepIndex + 1,
    });
    markCurrentLandingTourAsSeen();
    navigate(
      {
        pathname: ENTRY_PATH,
        search: location.search,
        hash: location.hash,
      },
      { replace: true },
    );
  };

  return (
    <>
      <LandingTourSnapshotBackdrop stepIndex={stepIndex} />
      <LandingTour
        stepIndex={stepIndex}
        onStepChange={setStepIndex}
        onComplete={() => enterService('completed')}
        onSkip={enterService}
      />
    </>
  );
}
