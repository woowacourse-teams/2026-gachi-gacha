import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { LAUNCH_EVENT_ID } from './launchEventConfig';
import {
  fetchLaunchEventMetadata,
  type LaunchEventInput,
  submitLaunchEvent,
} from './launchEventSubmission';

const endpoint = 'https://script.google.com/macros/s/test/exec';
const input: LaunchEventInput = {
  submissionId: '019ab251-394e-4a77-9c21-1221ea123456',
  memberId: '17',
  name: '테스트',
  phone: '010-1234-5678',
  reason: '가치가챠 앱 출시를 축하합니다.',
  privacyConsent: true,
  rulesConsent: true,
  rulesVersion: 'test-policy-v1',
};
const receipt = {
  ok: true,
  eventId: LAUNCH_EVENT_ID,
  submissionId: input.submissionId,
  receivedAt: '2026-11-12T00:00:00.000Z',
};
const metadata = {
  ok: true,
  eventId: LAUNCH_EVENT_ID,
  schemaVersion: 1,
  accepting: true,
  startAt: '2026-11-11T00:00:00+09:00',
  endAt: '2026-11-25T00:00:00+09:00',
  rulesVersion: 'test-policy-v1',
  privacy: {
    controller: '테스트 운영자',
    contact: 'test@example.com',
    purpose: '테스트 접수',
    items: ['이름', '연락처'],
    retentionDays: 30,
  },
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('새 이벤트 전용 전송 계약', () => {
  it('명시된 항목만 인증 쿠키·토큰 없이 보내고 확인된 영수증만 반환한다', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(receipt)));
    const withExtraSecret = { ...input, accessToken: 'must-not-send' };

    await expect(submitLaunchEvent(withExtraSecret, endpoint)).resolves.toEqual(
      {
        eventId: receipt.eventId,
        submissionId: receipt.submissionId,
        receivedAt: receipt.receivedAt,
      },
    );
    const options = fetchMock.mock.calls[0]?.[1];
    expect(options).toEqual(
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      }),
    );
    expect(JSON.parse(String(options?.body))).toEqual({
      ...input,
      eventId: LAUNCH_EVENT_ID,
      schemaVersion: 1,
      photos: [],
    });
  });

  it.each([
    '',
    '<html>permission denied</html>',
    JSON.stringify({ ok: true }),
    JSON.stringify({ ...receipt, eventId: 'old-event' }),
    JSON.stringify({ ...receipt, submissionId: 'different-id' }),
    JSON.stringify({ ...receipt, receivedAt: 'invalid' }),
    JSON.stringify({ ok: false, message: 'private server details' }),
  ])(
    '빈 응답·이전 계약·다른 영수증을 성공으로 오인하지 않는다',
    async (body) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body));
      await expect(submitLaunchEvent(input, endpoint)).rejects.toThrow(
        '응모 접수 결과를 확인하지 못했어요.',
      );
    },
  );

  it('올바르지 않은 접수 번호는 네트워크로 보내지 않는다', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await expect(
      submitLaunchEvent({ ...input, submissionId: 'not-uuid' }, endpoint),
    ).rejects.toThrow('응모 번호');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('접수 번호 대소문자를 서버와 동일하게 정규화한다', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(receipt)));
    await expect(
      submitLaunchEvent(
        { ...input, submissionId: input.submissionId.toUpperCase() },
        endpoint,
      ),
    ).resolves.toMatchObject({ submissionId: input.submissionId });
  });

  it('새 수신부의 공개 일정 및 동의 정책을 검증한다', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(metadata)));
    await expect(fetchLaunchEventMetadata(endpoint)).resolves.toMatchObject({
      eventId: LAUNCH_EVENT_ID,
      privacy: metadata.privacy,
    });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...metadata,
          privacy: { ...metadata.privacy, contact: '' },
        }),
      ),
    );
    await expect(fetchLaunchEventMetadata(endpoint)).rejects.toThrow(
      '이벤트 접수 설정',
    );
  });
});
