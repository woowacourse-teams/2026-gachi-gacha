const LANDING_TOUR_SEEN_STORAGE_KEY = 'landingTourSeenVersion';

export const LANDING_TOUR_VERSION = '1';

export function hasSeenCurrentLandingTour(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(LANDING_TOUR_SEEN_STORAGE_KEY) ===
      LANDING_TOUR_VERSION
    );
  } catch {
    return false;
  }
}

export function markCurrentLandingTourAsSeen(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      LANDING_TOUR_SEEN_STORAGE_KEY,
      LANDING_TOUR_VERSION,
    );
  } catch {
    // 저장소 접근이 제한된 환경에서도 서비스 진입은 계속 진행합니다.
  }
}
