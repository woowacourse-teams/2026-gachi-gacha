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

    await screen.findByRole('heading', { name: /원하는 가챠/ });

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

    await screen.findByRole('heading', { name: /원하는 가챠/ });

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
});
