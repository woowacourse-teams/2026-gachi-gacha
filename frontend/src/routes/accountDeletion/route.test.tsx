import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import App from '@/App';
import { storeAuthTokens } from '@/features/auth/authTokenStorage';
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

    expect(await screen.findByRole('heading')).toHaveTextContent(
      /회원 탈퇴를 위한\s*본인 확인\s*이 필요해요/,
    );
    expect(
      screen.getByRole('link', { name: '카카오로 본인 확인' }),
    ).toHaveAttribute('href', '/api/v1/oauth/kakao');
    expect(
      screen.getByRole('link', { name: '네이버로 본인 확인' }),
    ).toHaveAttribute('href', '/api/v1/oauth/naver');
  });

  it('로그인 사용자가 확인 문구를 입력하면 기존 회원 탈퇴 API로 계정을 삭제한다', async () => {
    const user = userEvent.setup();
    let requestedAuthorization: string | null = null;

    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
      http.delete('/api/v1/members/me', ({ request }) => {
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
  });

  it('회원 탈퇴 API가 실패하면 입력 내용을 유지하고 오류를 안내한다', async () => {
    const user = userEvent.setup();

    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
      http.delete('/api/v1/members/me', () =>
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
      http.delete('/api/v1/members/me', () =>
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
    await user.type(screen.getByRole('textbox', { name: /^확인 문구/ }), '탈퇴');
    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    await waitFor(() => {
      expect(mockedAssignBrowserLocation).toHaveBeenCalledWith(
        authorizationUrl,
      );
    });
  });

  it('Apple 재인증으로 받은 code를 회원 탈퇴 API에 전달한다', async () => {
    const user = userEvent.setup();
    let requestedCode: string | null = null;

    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'account-deletion-refresh-token',
    });

    server.use(
      http.get('/api/v1/members/me', () => HttpResponse.json(MEMBER_RESPONSE)),
      http.delete('/api/v1/members/me', ({ request }) => {
        requestedCode = new URL(request.url).searchParams.get('code');

        return HttpResponse.json({
          code: 'C003',
          message: '정상 삭제',
          data: { memberId: 1 },
        });
      }),
    );

    renderWithProviders(<App />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/account-deletion?code=apple-authorization-code',
    });

    await user.click(
      await screen.findByRole('button', { name: '회원 탈퇴 계속하기' }),
    );
    await user.type(screen.getByRole('textbox', { name: /^확인 문구/ }), '탈퇴');
    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    expect(
      await screen.findByRole('heading', {
        name: '계정 삭제 요청을 완료했어요',
      }),
    ).toBeInTheDocument();
    expect(requestedCode).toBe('apple-authorization-code');
  });
});
