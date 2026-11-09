import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import App from '@/App';
import {
  readAccessToken,
  readRefreshToken,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { assignBrowserLocation } from '@/shared/browser/browserNavigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

jest.mock('@/shared/browser/browserNavigation', () => ({
  assignBrowserLocation: jest.fn(),
}));

const mockedAssignBrowserLocation = jest.mocked(assignBrowserLocation);

const ACCESS_TOKEN = 'account-deletion-access-token';

const MEMBER_RESPONSE = {
  code: 'C000',
  message: '정상',
  data: {
    name: '김민지',
    nickname: '가챠러 민지',
    profileImageUrl: null,
    desireTradeLocation: null,
  },
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

beforeEach(() => {
  mockedAssignBrowserLocation.mockClear();
});

describe('외부 회원 탈퇴 페이지', () => {
  it('비로그인 사용자에게 공개되고 로그인 후 복귀할 수 있는 본인 확인 링크를 제공한다', async () => {
    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/account-deletion',
    });

    expect(
      await screen.findByRole('heading', { name: '가치가챠 회원 탈퇴' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '본인 확인 후 탈퇴' }),
    ).toHaveAttribute('href', '/login?returnTo=%2Faccount-deletion');
  });

  it('회원 탈퇴 복귀 경로에서는 소셜 로그인을 본인 확인으로 안내한다', async () => {
    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/login?returnTo=%2Faccount-deletion',
    });

    expect(
      await screen.findByRole('heading', { name: '회원 탈퇴 본인 확인' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('회원 탈퇴를 위해 본인 확인이 필요해요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '카카오로 본인 확인' }),
    ).toHaveAttribute('href', '/api/v1/oauth/kakao');
    expect(
      screen.getByRole('link', { name: '네이버로 본인 확인' }),
    ).toHaveAttribute('href', '/api/v1/oauth/naver');
    expect(
      screen.getByRole('link', { name: 'Apple로 본인 확인' }),
    ).toHaveAttribute('href', '/api/v1/oauth/apple');
  });

  it('로그인 사용자가 확인 문구를 입력하면 웹 OAuth 회원 탈퇴 API로 계정을 삭제한다', async () => {
    const user = userEvent.setup();
    let requestedAuthorization: string | null = null;

    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
      http.delete('/api/v1/oauth/withdraw', ({ request }) => {
        requestedAuthorization = request.headers.get('Authorization');

        return HttpResponse.json({
          code: 'C003',
          message: '정상 삭제',
          data: { memberId: 1 },
        });
      }),
    );

    renderWithProviders(<App />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/account-deletion',
    });

    expect(
      await screen.findByText('본인 확인 계정:', { exact: false }),
    ).toHaveTextContent('가챠러 민지');

    await user.click(
      screen.getByRole('button', { name: '회원 탈퇴 계속하기' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: /^확인 문구/ }),
      '탈퇴',
    );
    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    expect(
      await screen.findByRole('heading', {
        name: '계정 삭제 요청을 완료했어요',
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(requestedAuthorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    });
    expect(readAccessToken()).toBeNull();
    expect(readRefreshToken()).toBeNull();
  });

  it('회원 탈퇴 API가 실패하면 입력 내용을 유지하고 오류를 안내한다', async () => {
    const user = userEvent.setup();

    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
      http.delete('/api/v1/oauth/withdraw', () =>
        HttpResponse.json(
          {
            code: 'S001',
            message: '회원 탈퇴를 완료하지 못했습니다.',
            data: null,
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<App />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/account-deletion',
    });

    await user.click(
      await screen.findByRole('button', { name: '회원 탈퇴 계속하기' }),
    );
    const confirmationInput = screen.getByRole('textbox', {
      name: /^확인 문구/,
    });
    await user.type(confirmationInput, '탈퇴');
    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '회원 탈퇴를 완료하지 못했습니다.',
    );
    expect(confirmationInput).toHaveValue('탈퇴');
  });

  it('405 응답에는 다른 탈퇴 경로나 Apple 재인증으로 우회하지 않고 로그인과 입력을 유지한다', async () => {
    const user = userEvent.setup();
    const deletePaths: string[] = [];
    const reauthenticationPaths: string[] = [];

    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
      http.delete(/\/api\/v1\//, ({ request }) => {
        deletePaths.push(new URL(request.url).pathname);
        return HttpResponse.json(
          { code: 'CE002', message: '지원하지 않는 HTTP 메서드입니다.' },
          { status: 405 },
        );
      }),
      http.get(/\/api\/v1\/oauth\/withdraw/, ({ request }) => {
        reauthenticationPaths.push(new URL(request.url).pathname);
        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: 'https://appleid.apple.com/auth/authorize',
        });
      }),
    );

    renderWithProviders(<App />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/account-deletion',
    });

    await user.click(
      await screen.findByRole('button', { name: '회원 탈퇴 계속하기' }),
    );
    const confirmationInput = screen.getByRole('textbox', {
      name: /^확인 문구/,
    });
    await user.type(confirmationInput, '탈퇴');
    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '지원하지 않는 HTTP 메서드입니다.',
    );
    expect(deletePaths).toEqual(['/api/v1/oauth/withdraw']);
    expect(reauthenticationPaths).toEqual([]);
    expect(mockedAssignBrowserLocation).not.toHaveBeenCalled();
    expect(readAccessToken()).toBe(ACCESS_TOKEN);
    expect(readRefreshToken()).toBe('account-deletion-refresh-token');
    expect(confirmationInput).toHaveValue('탈퇴');
    expect(screen.getByRole('button', { name: '회원 탈퇴' })).toBeEnabled();
  });

  it('Apple 회원은 재인증이 필요하면 서버가 발급한 Apple 인증 주소로 이동한다', async () => {
    const user = userEvent.setup();
    const authorizationUrl =
      'https://appleid.apple.com/auth/authorize?response_type=code';

    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
      http.delete('/api/v1/oauth/withdraw', () =>
        HttpResponse.json(
          {
            code: 'AUE03',
            message: '로그인 요청이 유효하지 않습니다.',
          },
          { status: 400 },
        ),
      ),
      http.get('/api/v1/oauth/withdraw-url', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: authorizationUrl,
        }),
      ),
    );

    renderWithProviders(<App />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/account-deletion',
    });

    await user.click(
      await screen.findByRole('button', { name: '회원 탈퇴 계속하기' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: /^확인 문구/ }),
      '탈퇴',
    );
    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    await waitFor(() => {
      expect(mockedAssignBrowserLocation).toHaveBeenCalledWith(
        authorizationUrl,
      );
    });
    expect(readAccessToken()).toBe(ACCESS_TOKEN);
    expect(readRefreshToken()).toBe('account-deletion-refresh-token');
  });

  it.each([
    {
      caseName: '재인증 주소 조회가 실패하면',
      responseStatus: 500,
      responseBody: {
        code: 'S001',
        message: '회원 탈퇴 본인 확인 주소를 불러오지 못했습니다.',
      },
      errorMessage: '회원 탈퇴 본인 확인 주소를 불러오지 못했습니다.',
    },
    {
      caseName: 'Apple 이외의 주소를 받으면',
      responseStatus: 200,
      responseBody: {
        code: 'C000',
        message: '정상',
        data: 'https://example.com/auth/authorize',
      },
      errorMessage: '회원 탈퇴 본인 확인 주소가 올바르지 않습니다.',
    },
    {
      caseName: 'HTTPS가 아닌 Apple 주소를 받으면',
      responseStatus: 200,
      responseBody: {
        code: 'C000',
        message: '정상',
        data: 'http://appleid.apple.com/auth/authorize',
      },
      errorMessage: '회원 탈퇴 본인 확인 주소가 올바르지 않습니다.',
    },
  ])(
    '$caseName 이동하지 않고 로그인과 입력을 유지한다',
    async ({ responseStatus, responseBody, errorMessage }) => {
      const user = userEvent.setup();
      storeAuthTokens({
        accessToken: ACCESS_TOKEN,
        refreshToken: 'account-deletion-refresh-token',
      });

      server.use(
        http.get('/api/v1/members/me', () =>
          HttpResponse.json(MEMBER_RESPONSE),
        ),
        http.delete('/api/v1/oauth/withdraw', () =>
          HttpResponse.json(
            { code: 'AUE03', message: '로그인 요청이 유효하지 않습니다.' },
            { status: 400 },
          ),
        ),
        http.get('/api/v1/oauth/withdraw-url', () =>
          HttpResponse.json(responseBody, { status: responseStatus }),
        ),
      );

      renderWithProviders(<App />, {
        initialAccessToken: ACCESS_TOKEN,
        route: '/account-deletion',
      });

      await user.click(
        await screen.findByRole('button', { name: '회원 탈퇴 계속하기' }),
      );
      const confirmationInput = screen.getByRole('textbox', {
        name: /^확인 문구/,
      });
      await user.type(confirmationInput, '탈퇴');
      await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage);
      expect(mockedAssignBrowserLocation).not.toHaveBeenCalled();
      expect(readAccessToken()).toBe(ACCESS_TOKEN);
      expect(readRefreshToken()).toBe('account-deletion-refresh-token');
      expect(confirmationInput).toHaveValue('탈퇴');
      expect(screen.getByRole('button', { name: '회원 탈퇴' })).toBeEnabled();
    },
  );

  it('Apple 회원 탈퇴 콜백 성공 시 토큰을 삭제하고 완료 화면을 보여준다', async () => {
    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
    );

    renderWithProviders(<App />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/oauth/withdraw-callback#result=success',
    });

    expect(
      await screen.findByRole('heading', {
        name: '계정 삭제 요청을 완료했어요',
      }),
    ).toBeInTheDocument();
    expect(readAccessToken()).toBeNull();
    expect(readRefreshToken()).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('Apple 회원 탈퇴 콜백 오류를 안내하고 기존 로그인은 유지한다', async () => {
    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
    );

    renderWithProviders(<App />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/oauth/withdraw-callback#error=withdraw_failed',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '회원 탈퇴를 완료하지 못했습니다. 다시 시도해주세요.',
    );
    expect(readAccessToken()).toBe(ACCESS_TOKEN);
    expect(window.location.hash).toBe('');
  });
});
