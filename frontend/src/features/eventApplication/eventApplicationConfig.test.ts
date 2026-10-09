import { describe, expect, it } from '@jest/globals';

import {
  type EventApplicationConfig,
  getEventApplicationAvailability,
} from './eventApplicationConfig';

const OPEN_CONFIG = {
  enabled: true,
  endpoint: 'https://script.google.com/macros/s/test/exec',
  startAt: '2026-10-01T00:00:00+09:00',
  endAt: '2026-11-01T00:00:00+09:00',
} satisfies EventApplicationConfig;

describe('getEventApplicationAvailability', () => {
  it.each([
    ['upcoming', '2026-09-30T23:59:59+09:00'],
    ['open', '2026-10-01T00:00:00+09:00'],
    ['closed', '2026-11-01T00:00:00+09:00'],
  ] as const)('%s 기간을 구분한다', (expected, now) => {
    expect(getEventApplicationAvailability(OPEN_CONFIG, new Date(now))).toBe(
      expected,
    );
  });

  it('제출 주소나 유효한 기간이 빠지면 설정 오류로 처리한다', () => {
    expect(
      getEventApplicationAvailability(
        { ...OPEN_CONFIG, endpoint: '' },
        new Date('2026-10-10T00:00:00+09:00'),
      ),
    ).toBe('misconfigured');
    expect(
      getEventApplicationAvailability(
        { ...OPEN_CONFIG, endAt: OPEN_CONFIG.startAt },
        new Date('2026-10-10T00:00:00+09:00'),
      ),
    ).toBe('misconfigured');
  });
});
