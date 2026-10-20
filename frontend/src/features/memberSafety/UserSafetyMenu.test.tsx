import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { MemberBlockProvider } from './MemberBlockContext';
import { UserSafetyMenu } from './UserSafetyMenu';

beforeEach(() => {
  window.localStorage.clear();
  storeAuthTokens({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  });
});

describe('UserSafetyMenu', () => {
  it('확인 후 사용자를 차단하고 완료 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const onBlocked = jest.fn<() => void>();
    let requestedMemberId = '';

    server.use(
      http.put('/api/v1/blocks/:memberId', ({ params }) => {
        requestedMemberId = String(params.memberId);
        return HttpResponse.json({ code: 'C002', message: '차단 완료' });
      }),
    );

    renderWithProviders(
      <MemberBlockProvider>
        <UserSafetyMenu
          targetMemberId={7}
          targetNickname="쿠로미러버"
          source="comment"
          onBlocked={onBlocked}
        />
      </MemberBlockProvider>,
      { initialAccessToken: null },
    );

    await user.click(
      screen.getByRole('button', { name: '쿠로미러버 사용자 메뉴' }),
    );
    await user.click(screen.getByRole('menuitem', { name: '차단하기' }));
    await user.click(screen.getByRole('button', { name: '차단하기' }));

    expect(
      await screen.findByRole('button', { name: '쿠로미러버 사용자 메뉴' }),
    ).toBeInTheDocument();
    expect(requestedMemberId).toBe('7');
    expect(onBlocked).toHaveBeenCalledTimes(1);
  });

  it('신고 API가 없을 때 사유 폼은 보여주되 허위 접수를 허용하지 않는다', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemberBlockProvider>
        <UserSafetyMenu
          targetMemberId={7}
          targetNickname="쿠로미러버"
          source="trade"
        />
      </MemberBlockProvider>,
      { initialAccessToken: null },
    );

    await user.click(
      screen.getByRole('button', { name: '쿠로미러버 사용자 메뉴' }),
    );
    await user.click(screen.getByRole('menuitem', { name: '신고하기' }));
    await user.click(screen.getByRole('radio', { name: '스팸·광고' }));

    expect(screen.getByRole('button', { name: '접수 준비 중' })).toBeDisabled();
    expect(
      screen.getByText(/신고 접수 기능을 준비하고 있어요/),
    ).toBeInTheDocument();
  });
});
