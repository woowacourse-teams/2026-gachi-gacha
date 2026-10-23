import { http, HttpResponse } from 'msw';

const MOCK_BLOCKED_MEMBER = {
  memberId: 27,
  nickname: '차단한 가챠러',
  blockedAt: '2026-10-20T09:00:00',
};

export const memberSafetyHandlers = [
  http.get('/api/v1/blocks', () =>
    HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: { blocks: [MOCK_BLOCKED_MEMBER] },
    }),
  ),
  http.put('/api/v1/blocks/:memberId', ({ params }) =>
    HttpResponse.json({
      code: 'C002',
      message: '차단되었습니다.',
      data: {
        memberId: Number(params.memberId),
        blocked: true,
        blockedAt: '2026-10-20T09:00:00',
      },
    }),
  ),
  http.delete('/api/v1/blocks/:memberId', () =>
    HttpResponse.json({
      code: 'C003',
      message: '차단이 해제되었습니다.',
    }),
  ),
];
