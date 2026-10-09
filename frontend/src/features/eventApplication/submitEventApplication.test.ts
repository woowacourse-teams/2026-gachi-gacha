import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { EventApplicationInput } from './eventApplicationType';
import { submitEventApplication } from './submitEventApplication';

const INPUT = {
  eventId: 'popular-goods-giveaway-2026',
  memberId: '17',
  desiredTrack: 'BOTH',
  instagramId: 'gachi__.gacha',
  tradeId: 153,
  tradeUrl: 'https://gachigacha.kro.kr/trade/153',
  privacyConsent: true,
} satisfies EventApplicationInput;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('submitEventApplication', () => {
  it('Apps Script의 사전 요청을 피할 수 있는 단순 POST로 응모 정보를 보낸다', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    await submitEventApplication(
      INPUT,
      'https://script.google.com/macros/s/test/exec',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/test/exec',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(INPUT),
        credentials: 'omit',
      }),
    );
  });

  it('접수 서버가 실패를 반환하면 안내 메시지를 전달한다', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: '이미 응모했어요.' }),
        ),
      );

    await expect(
      submitEventApplication(
        INPUT,
        'https://script.google.com/macros/s/test/exec',
      ),
    ).rejects.toThrow('이미 응모했어요.');
  });
});
