import { delay, http, HttpResponse } from 'msw';

const CURRENT_MEMBER_API_PATH = '/api/v1/members/me';

export const AUTH_STORY_TOKEN = 'storybook-access-token';

export const authenticatedMemberHandler = http.get(
  CURRENT_MEMBER_API_PATH,
  ({ request }) => {
    if (request.headers.get('Authorization') !== `Bearer ${AUTH_STORY_TOKEN}`) {
      return HttpResponse.json(
        { code: 'A001', message: '인증 정보가 올바르지 않습니다.', data: null },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      code: 'C000',
      message: '요청에 성공했습니다.',
      data: {
        nickname: '가챠러 민지',
        profileImageUrl: null,
        desireTradeLocation: '홍대입구역',
      },
    });
  },
);

export const loadingMemberHandler = http.get(
  CURRENT_MEMBER_API_PATH,
  async () => {
    await delay('infinite');
  },
);

export const expiredMemberHandler = http.get(CURRENT_MEMBER_API_PATH, () =>
  HttpResponse.json(
    { code: 'A002', message: '로그인이 만료되었습니다.', data: null },
    { status: 401 },
  ),
);

export const failedMemberHandler = http.get(CURRENT_MEMBER_API_PATH, () =>
  HttpResponse.json(
    {
      code: 'S001',
      message: '회원 정보를 불러오지 못했습니다.',
      data: null,
    },
    { status: 500 },
  ),
);
