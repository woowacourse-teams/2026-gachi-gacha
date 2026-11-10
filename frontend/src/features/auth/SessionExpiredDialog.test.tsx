import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';

import { SessionExpiredDialog } from './SessionExpiredDialog';

const mockListeners = new Set<() => void>();

jest.mock('./api/authenticatedFetch', () => ({
  subscribeToAuthenticationExpired: (listener: () => void) => {
    mockListeners.add(listener);
    return () => mockListeners.delete(listener);
  },
}));

function expireSession() {
  act(() => {
    mockListeners.forEach((listener) => listener());
  });
}

function renderAt(route: string) {
  window.history.replaceState(null, '', route);

  return render(
    <BrowserRouter>
      <SessionExpiredDialog />
    </BrowserRouter>,
  );
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

describe('SessionExpiredDialog', () => {
  it('세션이 끝나면 확인 창을 띄우고 로그인 후 보던 화면으로 돌아오게 한다', async () => {
    const user = userEvent.setup();

    renderAt('/trade/12?from=list');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    expireSession();

    const dialog = screen.getByRole('alertdialog', {
      name: '로그인이 만료됐어요',
    });

    expect(dialog).toHaveAccessibleDescription(
      '다시 로그인하면 보던 화면으로 돌아와요.',
    );

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(window.location.pathname).toBe('/login');
    expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(
      '/trade/12?from=list',
    );
  });

  it('나중에를 누르면 창을 닫고 지금 화면을 계속 본다', async () => {
    const user = userEvent.setup();

    renderAt('/map');
    expireSession();
    await user.click(screen.getByRole('button', { name: '나중에' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/map');
  });

  it('회원 전용 화면에서는 로그인 화면 이동에 맡기고 창을 띄우지 않는다', () => {
    renderAt('/mypage');
    expireSession();

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
