import { describe, expect, it } from '@jest/globals';

import { formatRelativeTime } from './formatRelativeTime';

const NOW = new Date('2026-09-29T12:00:00').getTime();

describe('상대 시간 표시', () => {
  it.each([
    ['2026-09-29T11:59:30', '방금 전'],
    ['2026-09-29T11:30:00', '30분 전'],
    ['2026-09-29T11:00:00', '1시간 전'],
    ['2026-09-28T12:00:00', '1일 전'],
    ['2026-08-29T12:00:00', '1개월 전'],
    ['2025-09-29T12:00:00', '1년 전'],
  ])('%s을 %s으로 표시한다', (dateTime, expected) => {
    expect(formatRelativeTime(dateTime, NOW)).toBe(expected);
  });

  it('올바르지 않은 날짜는 안내 문구로 표시한다', () => {
    expect(formatRelativeTime('invalid-date', NOW)).toBe('등록일 확인 중');
  });
});
