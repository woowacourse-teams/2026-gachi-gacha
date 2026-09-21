import gachiGachaLogo from '@/assets/gachi-gacha-logo.png';

import {
  LoadingLogo,
  LoadingScreen,
  VisuallyHidden,
} from './PageLoadingFallback.styles';

export interface PageLoadingFallbackProps {
  label?: string;
}

export function PageLoadingFallback({
  label = '페이지를 준비하고 있어요.',
}: PageLoadingFallbackProps) {
  return (
    <LoadingScreen role="status" aria-live="polite" aria-busy="true">
      <LoadingLogo
        src={gachiGachaLogo}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      <VisuallyHidden>{label}</VisuallyHidden>
    </LoadingScreen>
  );
}
