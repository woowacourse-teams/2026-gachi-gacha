import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import { LoginRoute } from './route';

describe('LoginRoute', () => {
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
