import { describe, expect, it } from '@jest/globals';

import { formatConversationTime } from './conversationTime';

describe('채팅 목록의 한국 시각', () => {
  const now = new Date('2026-11-09T06:00:00Z');

  it.each([
    ['2026-11-09T05:16:00Z', '오후 2:16'],
    ['2026-11-09T14:16:00+09:00', '오후 2:16'],
    ['2026-11-09T14:16:00', '오후 2:16'],
    ['2026-11-08T11:02:00+09:00', '어제'],
    ['2026-11-01T11:00:00+09:00', '11월 1일'],
    ['invalid', ''],
  ])('%s는 %s로 표시한다', (value, expected) => {
    expect(formatConversationTime(value, now)).toBe(expected);
  });

  it('UTC 날짜가 같아도 한국 자정을 기준으로 어제를 구분한다', () => {
    expect(
      formatConversationTime(
        '2026-11-08T14:59:00Z',
        new Date('2026-11-08T15:01:00Z'),
      ),
    ).toBe('어제');
  });
});
