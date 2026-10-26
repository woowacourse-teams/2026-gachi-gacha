import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import { LoginRoute } from './route';

describe('LoginRoute', () => {
  it('Apple 로그인은 연동 전까지 비활성화된 버튼과 공식 로고 자산을 사용한다', async () => {
    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: '/login',
    });

    await screen.findByRole('heading', { name: /원하는 가챠/ });

    expect(
      screen.getByRole('button', {
        name: 'Apple로 로그인',
      }),
    ).toBeDisabled();

    const appleLogo = document.querySelector('[data-apple-logo]');

    expect(appleLogo).toHaveAttribute('src');
    expect(appleLogo).toHaveAttribute('width', '31');
    expect(appleLogo).toHaveAttribute('height', '44');
  });
});
