import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';

import {
  LAUNCH_EVENT_ID,
  LAUNCH_EVENT_SCHEMA_VERSION,
} from './launchEventConfig';
import {
  fetchLaunchEventMetadata,
  isLaunchEventInstagramId,
  type LaunchEventInput,
  normalizeLaunchEventInstagramId,
  submitLaunchEvent,
} from './launchEventSubmission';

const endpoint = '/event-api/launch-event';
const accessToken = `test.${btoa(JSON.stringify({ memberId: 17 }))}.test-signature`;
const input: LaunchEventInput = {
  submissionId: '019ab251-394e-4a77-9c21-1221ea123456',
  memberId: '17',
  name: '테스트',
  instagramId: 'gachi.gacha_1',
  tradeIds: [14, 27],
  privacyConsent: true,
  rulesConsent: true,
  rulesVersion: 'test-policy-v2',
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
  schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
  authentication: 'server-verified',
  accepting: true,
  startAt: '2026-11-11T00:00:00+09:00',
  endAt: '2026-11-25T00:00:00+09:00',
  rulesVersion: 'test-policy-v2',
  privacy: {
    controller: '테스트 운영자',
    contact: 'test@example.com',
    purpose: '테스트 접수',
    items: ['회원 번호', '이름', '인스타그램 아이디', '작성한 게시글 번호'],
    retentionDays: 30,
  },
};

beforeEach(() =>
  storeAuthTokens({ accessToken, refreshToken: 'test-refresh' }),
);

afterEach(() => {
  clearAuthTokens();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('새 이벤트 전용 전송 계약', () => {
  it('요청이 중단 신호에 반응하지 않아도 60초 뒤 폼 대기를 종료한다', async () => {
    jest.useFakeTimers();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => new Promise<Response>(() => {}));
    const result = expect(submitLaunchEvent(input, endpoint)).rejects.toThrow(
      '응모 접수 결과를 확인하지 못했어요.',
    );
    await jest.advanceTimersByTimeAsync(60_000);
    await result;
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it('우리 중계 경로에만 인증하고 클라이언트 회원·게시글 목록과 임의 필드를 전송하지 않는다', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(receipt)));
    const withExtraSecret = {
      ...input,
      accessToken: 'must-not-send',
      refreshToken: 'must-not-send-either',
      phone: 'old-phone',
      reason: 'old-reason',
      photos: [{ name: 'old.png', mimeType: 'image/png', data: 'old-photo' }],
    };

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
        redirect: 'error',
      }),
    );
    expect(new Headers(options?.headers).get('Authorization')).toBe(
      `Bearer ${accessToken}`,
    );
    expect(new Headers(options?.headers).get('Content-Type')).toBe(
      'application/json',
    );
    expect(JSON.parse(String(options?.body))).toEqual({
      submissionId: input.submissionId,
      name: input.name,
      instagramId: input.instagramId,
      privacyConsent: true,
      rulesConsent: true,
      rulesVersion: input.rulesVersion,
      expectedMemberId: input.memberId,
      eventId: LAUNCH_EVENT_ID,
      schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
    });
  });

  it('기존 Google 주소에는 인증 토큰이나 응모 정보를 보내지 않는다', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await expect(
      submitLaunchEvent(input, 'https://script.google.com/macros/s/test/exec'),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('로그인 정보가 없거나 폼의 회원과 다른 계정이면 제출하지 않는다', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    clearAuthTokens();
    await expect(submitLaunchEvent(input, endpoint)).rejects.toThrow('로그인');
    storeAuthTokens({ accessToken, refreshToken: 'test-refresh' });
    await expect(
      submitLaunchEvent({ ...input, memberId: '18' }, endpoint),
    ).rejects.toThrow('로그인');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('서버 인증 계약이 없는 메타데이터는 거절한다', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ...metadata, authentication: 'client-claimed' }),
        ),
      );
    await expect(fetchLaunchEventMetadata(endpoint)).rejects.toThrow(
      '이벤트 접수 설정',
    );
  });

  it('이름 공백과 인스타그램의 선택 @·대소문자를 정규화한다', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(receipt)));
    await submitLaunchEvent(
      { ...input, name: '  테스트  ', instagramId: '  @Gachi.Gacha_1  ' },
      endpoint,
    );
    expect(
      JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)),
    ).toMatchObject({ name: '테스트', instagramId: 'gachi.gacha_1' });
  });

  it.each([
    ['@Gachi.Gacha_1', 'gachi.gacha_1'],
    ['  GACHI  ', 'gachi'],
    ['a'.repeat(30), 'a'.repeat(30)],
  ])('유효한 아이디 %s를 정규화한다', (value, expected) => {
    expect(normalizeLaunchEventInstagramId(value)).toBe(expected);
    expect(isLaunchEventInstagramId(value)).toBe(true);
  });

  it.each([
    '',
    '@',
    '@@name',
    '한글',
    'two words',
    'https://instagram.com/name',
    'a'.repeat(31),
  ])(
    '잘못된 인스타그램 아이디 %s는 외부로 보내지 않는다',
    async (instagramId) => {
      const fetchMock = jest.spyOn(globalThis, 'fetch');
      expect(isLaunchEventInstagramId(instagramId)).toBe(false);
      await expect(
        submitLaunchEvent({ ...input, instagramId }, endpoint),
      ).rejects.toThrow('응모 정보와 참여 활동');
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    { name: '   ' },
    { name: '가'.repeat(81) },
    { memberId: '' },
    { memberId: '0' },
    { memberId: '1e2' },
    { memberId: String(Number.MAX_SAFE_INTEGER + 1) },
    { tradeIds: [] },
    { tradeIds: [0] },
    { tradeIds: [-1] },
    { tradeIds: [1.5] },
    { tradeIds: [Number.MAX_SAFE_INTEGER + 1] },
    { tradeIds: [14, 14] },
    { tradeIds: Array.from({ length: 10_001 }, (_, index) => index + 1) },
    { rulesVersion: '' },
  ])('불완전하거나 잘못된 참여 정보는 전송하지 않는다', async (patch) => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await expect(
      submitLaunchEvent({ ...input, ...patch }, endpoint),
    ).rejects.toThrow('응모 정보와 참여 활동');
    expect(fetchMock).not.toHaveBeenCalled();
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

  it('이전 schemaVersion 수신부 설정은 거부한다', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ...metadata, schemaVersion: 1 })),
      );
    await expect(fetchLaunchEventMetadata(endpoint)).rejects.toThrow(
      '이벤트 접수 설정',
    );
  });
});
