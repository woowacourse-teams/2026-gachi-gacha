import { describe, expect, it } from '@jest/globals';

import {
  formatLaunchEventDate,
  getLaunchEventDday,
} from './launchEventContent';

describe('이벤트 일시 표시', () => {
  it('명시한 시차가 달라도 한국 시간으로 표시한다', () => {
    expect(formatLaunchEventDate('2026-11-24T15:00:00Z')).toBe('11. 25. 00:00');
    expect(formatLaunchEventDate('2026-11-25T00:00:00+09:00')).toBe(
      '11. 25. 00:00',
    );
  });

  it('잘못된 날짜는 확정된 일시로 표시하지 않는다', () => {
    expect(formatLaunchEventDate('not-a-date')).toBe('추후 안내');
  });

  it.each([
    ['2026-11-11T00:00:00+09:00', 'D-13'],
    ['2026-11-23T23:59:59+09:00', 'D-1'],
    ['2026-11-24T00:00:00+09:00', 'D-DAY'],
    ['2026-11-24T23:59:59.999+09:00', 'D-DAY'],
    ['2026-11-25T00:00:00+09:00', '마감'],
    ['2026-11-25T00:00:01+09:00', '마감'],
  ])('배타적 마감일을 기준으로 %s에 %s를 표시한다', (now, expected) => {
    expect(getLaunchEventDday('2026-11-25T00:00:00+09:00', new Date(now))).toBe(
      expected,
    );
  });

  it('같은 날 자정이 아닌 시각에 마감해도 마감 전은 D-DAY다', () => {
    expect(
      getLaunchEventDday(
        '2026-11-24T23:59:59+09:00',
        new Date('2026-11-24T10:00:00+09:00'),
      ),
    ).toBe('D-DAY');
  });

  it('유효하지 않은 마감일은 카운트다운하지 않는다', () => {
    expect(getLaunchEventDday('', new Date('2026-11-11T00:00:00+09:00'))).toBe(
      '마감',
    );
  });
});
