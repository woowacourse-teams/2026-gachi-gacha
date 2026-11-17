import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { http, HttpResponse } from 'msw';

import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import { collectLaunchEventParticipation } from './collectLaunchEventParticipation';

function token(memberId = 7, version = 'original'): string {
  return `header.${btoa(JSON.stringify({ memberId }))}.${version}`;
}

function signIn(memberId = 7, version = 'original'): void {
  storeAuthTokens({
    accessToken: token(memberId, version),
    refreshToken: `refresh-${memberId}-${version}`,
  });
}

function trade(tradeId: number, memberId = 7) {
  return {
    tradeId,
    memberId,
    status: ['AVAILABLE', 'IN_PROGRESS', 'COMPLETED'][tradeId % 3],
  };
}

function response(data: unknown) {
  return HttpResponse.json({ code: 'C000', message: '성공', data });
}

function page(
  ids: number[],
  number = 0,
  metadata: Record<string, unknown> = { last: true },
) {
  return {
    content: ids.map((id) => trade(id)),
    number,
    size: 100,
    ...metadata,
  };
}

describe('이벤트 참여 교환글 수집', () => {
  beforeEach(() => signIn());

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('첫 화면 20개를 넘는 모든 페이지와 모든 상태를 인증 요청으로 수집한다', async () => {
    const requestedPages: number[] = [];
    const ids = Array.from({ length: 125 }, (_, index) => index + 1);

    server.use(
      http.get('/api/v1/trades/me', ({ request }) => {
        const url = new URL(request.url);
        const number = Number(url.searchParams.get('page'));
        requestedPages.push(number);
        expect(request.headers.get('authorization')).toBe(`Bearer ${token()}`);
        expect(url.searchParams.get('size')).toBe('100');
        expect(url.searchParams.has('status')).toBe(false);

        return response(
          page(ids.slice(number * 100, (number + 1) * 100), number, {
            totalElements: 125,
            totalPages: 2,
          }),
        );
      }),
    );

    await expect(collectLaunchEventParticipation('7')).resolves.toEqual({
      memberId: '7',
      tradeIds: ids,
    });
    expect(requestedPages).toEqual([0, 1]);
  });

  it('합계 없는 last 페이지 규약도 끝까지 수집하고 중복 ID를 제거해 정렬한다', async () => {
    server.use(
      http.get('/api/v1/trades/me', ({ request }) => {
        const number = Number(new URL(request.url).searchParams.get('page'));
        return response(
          page(number === 0 ? [9, 3, 3] : [3, 1], number, {
            last: number === 1,
          }),
        );
      }),
    );

    await expect(collectLaunchEventParticipation('7')).resolves.toEqual({
      memberId: '7',
      tradeIds: [1, 3, 9],
    });
  });

  it.each([{ last: true }, { totalElements: 0, totalPages: 0 }])(
    '작성 글이 없으면 빈 목록을 반환한다: %j',
    async (metadata) => {
      server.use(
        http.get('/api/v1/trades/me', () => response(page([], 0, metadata))),
      );

      await expect(collectLaunchEventParticipation('7')).resolves.toEqual({
        memberId: '7',
        tradeIds: [],
      });
    },
  );

  it('같은 회원의 access token이 갱신되어도 계속 수집한다', async () => {
    const authorizations: Array<string | null> = [];
    server.use(
      http.get('/api/v1/trades/me', ({ request }) => {
        const authorization = request.headers.get('authorization');
        authorizations.push(authorization);
        if (authorization === `Bearer ${token()}`) {
          return HttpResponse.json(
            { code: 'A001', message: '만료' },
            { status: 401 },
          );
        }
        return response(page([11]));
      }),
      http.post('/api/v1/auth/refresh', () =>
        response({
          accessToken: token(7, 'renewed'),
          refreshToken: 'renewed-refresh',
        }),
      ),
    );

    await expect(collectLaunchEventParticipation('7')).resolves.toEqual({
      memberId: '7',
      tradeIds: [11],
    });
    expect(authorizations).toEqual([
      `Bearer ${token()}`,
      `Bearer ${token(7, 'renewed')}`,
    ]);
  });

  it.each(['', '8'])(
    '유효하지 않거나 다른 예상 계정이면 요청 전에 실패한다: %s',
    async (expectedMemberId) => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch');
      await expect(
        collectLaunchEventParticipation(expectedMemberId),
      ).rejects.toThrow('로그인 계정');
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('로그아웃 상태이면 요청 전에 실패한다', async () => {
    clearAuthTokens();
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
      '로그인 계정',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('회원 ID를 읽을 수 없는 토큰이면 요청 전에 실패한다', async () => {
    storeAuthTokens({ accessToken: 'invalid-token', refreshToken: 'refresh' });
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
      '로그인 계정',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(['switch', 'logout'])(
    '페이지 수집 도중 계정 변경이나 로그아웃이 있으면 전부 실패한다: %s',
    async (change) => {
      server.use(
        http.get('/api/v1/trades/me', ({ request }) => {
          const number = Number(new URL(request.url).searchParams.get('page'));
          if (number === 1) {
            if (change === 'switch') signIn(8);
            else clearAuthTokens();
          }
          return response(page([number + 1], number, { last: number === 1 }));
        }),
      );

      await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
        '로그인 계정',
      );
    },
  );

  it('마지막 응답 JSON을 읽는 동안 계정이 바뀌어도 실패한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => {
        signIn(8);
        return { code: 'C000', message: '성공', data: page([1]) };
      },
    } as Response);

    await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
      '로그인 계정',
    );
  });

  it('후속 페이지 API 실패 시 앞 페이지의 일부 결과를 반환하지 않는다', async () => {
    server.use(
      http.get('/api/v1/trades/me', ({ request }) => {
        const number = Number(new URL(request.url).searchParams.get('page'));
        return number === 0
          ? response(page([1], 0, { last: false }))
          : new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
      '전체 목록',
    );
  });

  it.each([
    { ...page([1]), content: [trade(1), { tradeId: '2', memberId: 7 }] },
    { ...page([1]), content: [trade(1, 8)] },
    { ...page([1]), content: [trade(0)] },
    { ...page([1]), content: [trade(Number.MAX_SAFE_INTEGER + 1)] },
    page([1], 1),
    page([1], 0, { last: 'true' }),
    page([1], 0, {}),
    page([1], 0, { totalElements: 2, totalPages: 1 }),
    page([1], 0, { totalElements: 1, totalPages: 2 }),
    page([1], 0, { totalElements: 1, totalPages: 1, last: false }),
    page([], 0, { last: false }),
    page([1], 0, { totalElements: 10_001, totalPages: 101 }),
  ])(
    '잘못된 행·페이지·누락된 게시글·상한 초과를 성공으로 처리하지 않는다: %j',
    async (data) => {
      server.use(http.get('/api/v1/trades/me', () => response(data)));

      await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
        '전체 목록',
      );
    },
  );

  it('끝나지 않고 같은 글만 반복하는 페이지를 거부한다', async () => {
    let requestCount = 0;
    server.use(
      http.get('/api/v1/trades/me', ({ request }) => {
        requestCount += 1;
        const number = Number(new URL(request.url).searchParams.get('page'));
        return response(page([1], number, { last: false }));
      }),
    );

    await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
      '전체 목록',
    );
    expect(requestCount).toBe(2);
  });

  it('수집 중 전체 게시글 개수가 바뀌면 다시 조회하도록 실패한다', async () => {
    server.use(
      http.get('/api/v1/trades/me', ({ request }) => {
        const number = Number(new URL(request.url).searchParams.get('page'));
        return response(
          page([number + 1], number, {
            size: 1,
            totalElements: number === 0 ? 2 : 3,
            totalPages: number === 0 ? 2 : 3,
          }),
        );
      }),
    );

    await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
      '전체 목록',
    );
  });

  it.each([10_000, 10_001])(
    '합계가 없는 응답에서도 10,000개 상한을 지킨다: %i개',
    async (count) => {
      const ids = Array.from({ length: count }, (_, index) => index + 1);
      jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const number = Number(
          new URL(String(input), window.location.origin).searchParams.get(
            'page',
          ),
        );

        return Response.json({
          code: 'C000',
          message: '성공',
          data: page(ids.slice(number * 100, (number + 1) * 100), number, {
            last: (number + 1) * 100 >= count,
          }),
        });
      });

      if (count === 10_000) {
        await expect(collectLaunchEventParticipation('7')).resolves.toEqual({
          memberId: '7',
          tradeIds: ids,
        });
      } else {
        await expect(collectLaunchEventParticipation('7')).rejects.toThrow(
          '전체 목록',
        );
      }
    },
  );

  it('요청이 멈추면 30초 후 중단하고 부분 결과를 반환하지 않는다', async () => {
    jest.useFakeTimers();
    let requestSignal: AbortSignal | null | undefined;
    jest.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      requestSignal = init?.signal;
      return new Promise<Response>(() => undefined);
    });
    const result = collectLaunchEventParticipation('7');
    const failure = expect(result).rejects.toThrow('시간이 초과');

    await jest.advanceTimersByTimeAsync(30_000);
    await failure;
    expect(requestSignal?.aborted).toBe(true);
  });
});
