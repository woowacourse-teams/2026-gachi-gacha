import { describe, expect, it } from '@jest/globals';

import { formatChatDateLabel, toChatDateKey } from './chatDate';

const NOW = new Date(2026, 9, 1, 12, 0);

describe('chatDate', () => {
  it('메시지 시각을 날짜 키로 바꾸고, 잘못된 값은 빈 문자열로 둔다', () => {
    expect(toChatDateKey('2026-09-29T14:00:00')).toBe('2026-09-29');
    expect(toChatDateKey('잘못된 시각')).toBe('');
  });

  it('오늘, 어제, 같은 해, 다른 해를 구분해 표시한다', () => {
    expect(formatChatDateLabel('2026-10-01', NOW)).toBe('오늘');
    // 월이 바뀌는 경계에서도 전날을 어제로 표시한다.
    expect(formatChatDateLabel('2026-09-30', NOW)).toBe('어제');
    expect(formatChatDateLabel('2026-09-05', NOW)).toBe('9월 5일');
    expect(formatChatDateLabel('2025-12-31', NOW)).toBe('2025년 12월 31일');
    expect(formatChatDateLabel('', NOW)).toBe('');
  });
});
