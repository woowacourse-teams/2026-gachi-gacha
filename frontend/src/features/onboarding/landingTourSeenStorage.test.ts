import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  hasSeenCurrentLandingTour,
  LANDING_TOUR_VERSION,
  markCurrentLandingTourAsSeen,
} from './landingTourSeenStorage';

describe('landingTourSeenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('현재 버전의 랜딩 투어 완료 여부를 저장하고 읽는다', () => {
    expect(hasSeenCurrentLandingTour()).toBe(false);

    markCurrentLandingTourAsSeen();

    expect(window.localStorage.getItem('landingTourSeenVersion')).toBe(
      LANDING_TOUR_VERSION,
    );
    expect(hasSeenCurrentLandingTour()).toBe(true);
  });

  it('이전 버전의 완료 기록은 현재 랜딩 투어를 본 것으로 취급하지 않는다', () => {
    window.localStorage.setItem('landingTourSeenVersion', '0');

    expect(hasSeenCurrentLandingTour()).toBe(false);
  });
});
