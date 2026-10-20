import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { MemberReportInput } from './submitMemberReport';
import { submitMemberReport } from './submitMemberReport';

const INPUT = {
  reportId: 'report-1',
  reporterMemberId: '3',
  targetMemberId: 7,
  targetNickname: '쿠로미러버',
  source: 'comment',
  referenceId: 'comment-12',
  reason: 'harassment',
  details: '반복적으로 욕설을 작성했습니다.',
  pagePath: '/trade/15',
  submittedAt: '2026-10-20T05:00:00.000Z',
  appVersion: '1.10.0',
  environment: 'test',
} satisfies MemberReportInput;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('submitMemberReport', () => {
  it('Apps Script의 사전 요청을 피할 수 있는 단순 POST로 신고 정보를 보낸다', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    await submitMemberReport(
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

  it('저장소가 실패를 반환하면 성공으로 처리하지 않는다', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: '신고 정보를 확인해 주세요.' }),
        ),
      );

    await expect(
      submitMemberReport(INPUT, 'https://script.google.com/macros/s/test/exec'),
    ).rejects.toThrow('신고 정보를 확인해 주세요.');
  });
});
