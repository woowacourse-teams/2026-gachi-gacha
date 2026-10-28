import { delay, http, HttpResponse } from 'msw';

const CURRENT_MEMBER_API_PATH = '/api/v1/members/me';
const REFRESH_API_PATH = '/api/v1/auth/refresh';

export const AUTH_STORY_TOKEN = 'storybook-access-token';
export const AUTH_STORY_EXPIRED_TOKEN = 'storybook-expired-access-token';
export const AUTH_STORY_REFRESH_TOKEN = 'storybook-refresh-token';
export const AUTH_STORY_REFRESHED_TOKEN = 'storybook-refreshed-access-token';

const AUTHENTICATED_MEMBER_DATA = {
  name: '김민지',
  nickname: '가챠러 민지',
  profileImageUrl: null,
  desireTradeLocation: '홍대입구역',
};

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
      data: AUTHENTICATED_MEMBER_DATA,
    });
  },
);

const refreshingMemberHandler = http.get(
  CURRENT_MEMBER_API_PATH,
  ({ request }) => {
    const authorization = request.headers.get('Authorization');

    if (authorization === `Bearer ${AUTH_STORY_EXPIRED_TOKEN}`) {
      return HttpResponse.json(
        { code: 'A002', message: '로그인이 만료되었습니다.', data: null },
        { status: 401 },
      );
    }

    if (authorization === `Bearer ${AUTH_STORY_REFRESHED_TOKEN}`) {
      return HttpResponse.json({
        code: 'C000',
        message: '요청에 성공했습니다.',
        data: AUTHENTICATED_MEMBER_DATA,
      });
    }

    return HttpResponse.json(
      { code: 'A001', message: '인증 정보가 올바르지 않습니다.', data: null },
      { status: 401 },
    );
  },
);

const refreshAuthTokenHandler = http.post(
  REFRESH_API_PATH,
  async ({ request }) => {
    const body: unknown = await request.json();
    const refreshToken =
      typeof body === 'object' && body !== null && 'refreshToken' in body
        ? body.refreshToken
        : null;

    if (refreshToken !== AUTH_STORY_REFRESH_TOKEN) {
      return HttpResponse.json(
        { code: 'A002', message: '로그인이 만료되었습니다.', data: null },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      code: 'C000',
      message: '요청에 성공했습니다.',
      data: {
        accessToken: AUTH_STORY_REFRESHED_TOKEN,
        refreshToken: 'storybook-rotated-refresh-token',
      },
    });
  },
);

export const refreshingSessionHandlers = [
  refreshingMemberHandler,
  refreshAuthTokenHandler,
];

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
