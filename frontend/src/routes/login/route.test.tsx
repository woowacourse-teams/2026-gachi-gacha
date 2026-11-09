import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import { LoginRoute } from './route';

describe('LoginRoute', () => {
  it('지원하는 소셜 로그인만 원형 아이콘과 제공자 이름으로 표시한다', async () => {
    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: '/login',
    });

    await screen.findByRole('heading', { name: '로그인' });

    const providers = [
      { name: '카카오', href: '/api/v1/oauth/kakao' },
      { name: '네이버', href: '/api/v1/oauth/naver' },
      { name: 'Apple', href: '/api/v1/oauth/apple' },
    ];

    expect(screen.getAllByRole('link', { name: /로 로그인/ })).toEqual(
      providers.map(({ name }) =>
        screen.getByRole('link', { name: `${name}로 로그인` }),
      ),
    );

    providers.forEach(({ name, href }) => {
      const link = screen.getByRole('link', { name: `${name}로 로그인` });

      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveTextContent(name);
      expect(link.querySelector('img')).toHaveAttribute('src');
    });

    expect(
      screen.queryByRole('link', { name: /구글|휴대폰|이메일/ }),
    ).toBeNull();
  });

  it('Apple 로그인은 기존 OAuth 시작 경로와 공식 로고 자산을 사용한다', async () => {
    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: '/login',
    });

    await screen.findByRole('heading', { name: '로그인' });

    expect(
      screen.getByRole('link', {
        name: 'Apple로 로그인',
      }),
    ).toHaveAttribute('href', '/api/v1/oauth/apple');

    const appleLogo = document.querySelector('[data-apple-logo]');

    expect(appleLogo).toHaveAttribute('src');
    expect(appleLogo).toHaveAttribute('width', '31');
    expect(appleLogo).toHaveAttribute('height', '44');
  });

  it('닫기를 누르면 로그인 전 화면으로 돌아간다', async () => {
    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: `/login?returnTo=${encodeURIComponent('/trade/12?from=list')}`,
    });

    expect(
      await screen.findByRole('link', { name: '로그인 닫기', hidden: true }),
    ).toHaveAttribute('href', '/trade/12?from=list');
  });

  it('돌아갈 화면이 회원 전용이면 닫기는 홈으로 보낸다', async () => {
    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: `/login?returnTo=${encodeURIComponent('/mypage')}`,
    });

    expect(
      await screen.findByRole('link', { name: '로그인 닫기', hidden: true }),
    ).toHaveAttribute('href', '/trade');
  });

  it('회원 탈퇴 본인 확인 흐름에서는 안내 문구와 확인용 이름을 사용한다', async () => {
    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: `/login?returnTo=${encodeURIComponent('/account-deletion')}`,
    });

    expect(
      await screen.findByRole('heading', { name: '회원 탈퇴 본인 확인' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('회원 탈퇴를 위해 본인 확인이 필요해요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '카카오로 본인 확인' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '개인정보처리방침' }),
    ).not.toBeInTheDocument();
  });
});
