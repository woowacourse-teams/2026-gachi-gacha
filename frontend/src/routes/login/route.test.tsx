import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  prepareAppleSignIn,
  signInWithApple,
} from '@/features/auth/signInWithApple';
import { renderWithProviders } from '@/test/renderWithProviders';

import { LoginRoute } from './route';

jest.mock('@/features/auth/signInWithApple', () => ({
  prepareAppleSignIn: jest.fn(),
  signInWithApple: jest.fn(),
}));

const mockedPrepareAppleSignIn = jest.mocked(prepareAppleSignIn);
const mockedSignInWithApple = jest.mocked(signInWithApple);

beforeEach(() => {
  mockedPrepareAppleSignIn.mockReset();
  mockedPrepareAppleSignIn.mockResolvedValue();
  mockedSignInWithApple.mockReset();
});

describe('LoginRoute', () => {
  it('Apple 로그인은 팝업 인증을 시작하는 버튼과 공식 로고 자산을 사용한다', async () => {
    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: '/login',
    });

    await screen.findByRole('heading', { name: /원하는 가챠/ });

    expect(
      await screen.findByRole('button', {
        name: 'Apple로 로그인',
      }),
    ).toBeEnabled();

    const appleLogo = document.querySelector('[data-apple-logo]');

    expect(appleLogo).toHaveAttribute('src');
    expect(appleLogo).toHaveAttribute('width', '31');
    expect(appleLogo).toHaveAttribute('height', '44');
  });

  it('Apple 로그인 버튼을 누르면 팝업 인증을 시작하고 실패를 안내한다', async () => {
    const user = userEvent.setup();

    mockedSignInWithApple.mockRejectedValue(
      new Error('Apple 로그인이 취소되었습니다.'),
    );

    renderWithProviders(<LoginRoute />, {
      initialAccessToken: null,
      route: '/login',
    });

    await user.click(
      await screen.findByRole('button', { name: 'Apple로 로그인' }),
    );

    expect(mockedSignInWithApple).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Apple 로그인이 취소되었습니다.',
    );
  });
});
