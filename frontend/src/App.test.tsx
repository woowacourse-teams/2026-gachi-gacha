import { describe, expect, it, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import App from '@/App';
import { storeAuthReturnPath } from '@/features/auth/authReturnPath';
import {
  readAccessToken,
  readRefreshToken,
} from '@/features/auth/authTokenStorage';
import { replaceBrowserLocation } from '@/shared/browser/browserNavigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

jest.mock('@/shared/browser/browserNavigation', () => ({
  assignBrowserLocation: jest.fn(),
  replaceBrowserLocation: jest.fn(),
}));

const mockedReplaceBrowserLocation = jest.mocked(replaceBrowserLocation);

const accessToken = 'test-access-token';
const refreshToken = 'test-refresh-token';

describe('앱의 P0 인증과 라우팅 흐름', () => {
  it('비로그인 사용자가 마이페이지에 접근하면 복귀 주소를 포함한 로그인 화면으로 이동한다', async () => {
    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/mypage?tab=stores#saved',
    });

    await waitFor(() => {
      expect(mockedReplaceBrowserLocation).toHaveBeenCalledWith(
        '/login?returnTo=%2Fmypage%3Ftab%3Dstores%23saved',
      );
    });
  });

  it('OAuth callback 성공 시 토큰과 회원 정보를 반영하고 기존 화면으로 복귀한다', async () => {
    let requestedAuthorization: string | null = null;

    storeAuthReturnPath('/mypage?tab=stores');
    server.use(
      http.get('/api/v1/oauth/login/kakao', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;

        expect(searchParams.get('code')).toBe('authorization-code');
        expect(searchParams.get('state')).toBe('oauth-state');

        return HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: { accessToken, refreshToken },
        });
      }),
      http.get('/api/v1/members/me', ({ request }) => {
        requestedAuthorization = request.headers.get('Authorization');

        return HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: {
            name: '김민지',
            nickname: '가챠러 민지',
            profileImageUrl: null,
            desireTradeLocation: '홍대입구역',
          },
        });
      }),
    );

    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/oauth/login/kakao?code=authorization-code&state=oauth-state',
    });

    await waitFor(() => {
      expect(mockedReplaceBrowserLocation).toHaveBeenCalledWith(
        '/mypage?tab=stores',
      );
    });
    expect(readAccessToken()).toBe(accessToken);
    expect(readRefreshToken()).toBe(refreshToken);
    expect(requestedAuthorization).toBe(`Bearer ${accessToken}`);
  });

  it('OAuth API 오류가 발생하면 오류 안내와 다시 로그인 링크를 보여준다', async () => {
    storeAuthReturnPath('/notifications');
    server.use(
      http.get('/api/v1/oauth/login/naver', () =>
        HttpResponse.json(
          {
            code: 'A500',
            message: '소셜 로그인을 완료하지 못했습니다.',
            data: null,
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/oauth/login/naver?code=invalid-code&state=oauth-state',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그인을 완료하지 못했어요',
    );
    expect(screen.getByRole('link', { name: '다시 로그인' })).toHaveAttribute(
      'href',
      '/login?returnTo=%2Fnotifications',
    );
    expect(mockedReplaceBrowserLocation).not.toHaveBeenCalled();
  });

  it('잘못된 URL은 쿼리와 해시를 유지한 홈 화면으로 이동한다', async () => {
    server.use(
      http.get('/api/v1/gachas/category/:category', () =>
        HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: { content: [], number: 0, last: true },
        }),
      ),
    );

    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/unknown-page?from=shared-link#results',
    });

    expect(
      await screen.findByText('오늘은 어떤 가챠를 찾아볼까요?'),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?from=shared-link');
    expect(window.location.hash).toBe('#results');
  });

  it('중고거래 URL에서 SecondhandPage 화면을 보여준다', async () => {
    server.use(
      http.get('/api/v1/trades', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 20,
          },
        }),
      ),
    );

    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/used-market',
    });

    expect(
      await screen.findByRole('heading', {
        name: '어떤 가챠를 교환해볼까요?',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('중고거래 페이지를 준비하고 있어요'),
    ).not.toBeInTheDocument();
  });

  it('교환 게시글 카드를 선택하면 상세 페이지로 이동한다', async () => {
    server.use(
      http.get('/api/v1/trades', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 0);

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content:
              page === 0
                ? [
                    {
                      tradeId: 15,
                      memberId: 3,
                      title: '쿠로미 피규어 교환해요',
                      status: 'AVAILABLE',
                      categories: ['피규어', '산리오'],
                      thumbnailUrl: null,
                      tradePlace: null,
                      createdAt: '2026-09-29T10:00:00',
                    },
                    {
                      tradeId: 22,
                      memberId: 5,
                      title: '피카츄 키링 교환해요',
                      status: 'AVAILABLE',
                      categories: ['포켓몬'],
                      thumbnailUrl: null,
                      tradePlace: null,
                      createdAt: '2026-09-29T09:00:00',
                    },
                  ]
                : [
                    {
                      tradeId: 23,
                      memberId: 6,
                      title: '시나모롤 피규어 교환해요',
                      status: 'AVAILABLE',
                      categories: ['산리오'],
                      thumbnailUrl: null,
                      tradePlace: null,
                      createdAt: '2026-09-28T09:00:00',
                    },
                  ],
            totalElements: 3,
            totalPages: 2,
            number: page,
            size: 20,
          },
        });
      }),
      http.get('/api/v1/trades/15', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            tradeId: 15,
            memberId: 3,
            title: '쿠로미 피규어 교환해요',
            description: '개봉만 한 상품입니다.',
            desiredProduction: '시나모롤 키링',
            categories: ['피규어', '산리오'],
            status: 'AVAILABLE',
            purchaseStore: null,
            tradePlace: null,
            availableTime: null,
            imageUrls: [],
            createdAt: '2026-09-29T10:00:00',
            updatedAt: '2026-09-29T10:00:00',
          },
        }),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<App />, {
      initialAccessToken: null,
      route: '/used-market',
    });

    await user.click(
      await screen.findByRole('link', {
        name: /\ucfe0\ub85c\ubbf8 \ud53c\uaddc\uc5b4 \uad50\ud658\ud574\uc694/,
      }),
    );

    expect(window.location.pathname).toBe('/used-market/15');
    expect(
      await screen.findByRole('heading', {
        name: '쿠로미 피규어 교환해요',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('개봉만 한 상품입니다.')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: '다른 중고 물품' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /피카츄 키링 교환해요/ }),
    ).toHaveAttribute('href', '/used-market/22');

    await user.click(screen.getByRole('button', { name: '더보기' }));

    expect(
      await screen.findByRole('link', {
        name: /시나모롤 피규어 교환해요/,
      }),
    ).toHaveAttribute('href', '/used-market/23');
  });
});
