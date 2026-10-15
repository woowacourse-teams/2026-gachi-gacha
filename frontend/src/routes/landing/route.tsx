import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import LandingTour, { type LandingTourStepIndex } from './LandingTour';
import LandingTourSnapshotBackdrop from './LandingTourSnapshotBackdrop';

const ENTRY_PATH = '/trade';

export function LandingRoute() {
  const { status } = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState<LandingTourStepIndex>(0);

  const entryLocation = {
    pathname: ENTRY_PATH,
    search: location.search,
    hash: location.hash,
  };

  if (status === 'loading') {
    return <PageLoadingFallback label="로그인 상태를 확인하고 있어요." />;
  }

  if (status === 'authenticated') {
    return <Navigate replace to={entryLocation} />;
  }

  const enterService = () => {
    navigate(entryLocation, { replace: true });
  };

  return (
    <>
      <LandingTourSnapshotBackdrop stepIndex={stepIndex} />
      <LandingTour
        stepIndex={stepIndex}
        onStepChange={setStepIndex}
        onComplete={enterService}
        onSkip={enterService}
      />
    </>
  );
}
