import { useState } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
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

afterEach(() => {
  jest.restoreAllMocks();
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

  it('차단한 대상이 화면에서 사라져도 이어서 신고할 수 있다', async () => {
    const user = userEvent.setup();

    server.use(
      http.put('/api/v1/blocks/:memberId', () =>
        HttpResponse.json({ code: 'C002', message: '차단 완료' }),
      ),
    );

    function HiddenAfterBlockMenu() {
      const [visible, setVisible] = useState(true);

      return visible ? (
        <UserSafetyMenu
          targetMemberId={7}
          targetNickname="쿠로미러버"
          source="comment"
          referenceId="comment-12"
          onBlocked={() => setVisible(false)}
        />
      ) : null;
    }

    renderWithProviders(
      <MemberBlockProvider>
        <HiddenAfterBlockMenu />
      </MemberBlockProvider>,
      { initialAccessToken: null },
    );

    await user.click(
      screen.getByRole('button', { name: '쿠로미러버 사용자 메뉴' }),
    );
    await user.click(screen.getByRole('menuitem', { name: '차단하기' }));
    await user.click(screen.getByRole('button', { name: '차단하기' }));

    expect(
      await screen.findByRole('heading', { name: '차단이 완료됐어요' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '쿠로미러버 사용자 메뉴' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이어서 신고하기' }));

    expect(
      await screen.findByRole('heading', { name: '쿠로미러버님 신고하기' }),
    ).toBeInTheDocument();
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

  it('신고 저장소가 설정되면 저장 성공 후에만 접수 완료를 안내한다', async () => {
    const user = userEvent.setup();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    renderWithProviders(
      <MemberBlockProvider reportEndpoint="https://script.google.com/macros/s/test/exec">
        <UserSafetyMenu
          targetMemberId={7}
          targetNickname="쿠로미러버"
          source="trade"
          referenceId="15"
        />
      </MemberBlockProvider>,
      { initialAccessToken: null, route: '/trade/15' },
    );

    await user.click(
      screen.getByRole('button', { name: '쿠로미러버 사용자 메뉴' }),
    );
    await user.click(screen.getByRole('menuitem', { name: '신고하기' }));
    await user.click(screen.getByRole('radio', { name: '욕설·괴롭힘' }));
    await user.type(
      screen.getByRole('textbox', { name: '자세한 내용 (선택)' }),
      '반복적으로 욕설을 작성했습니다.',
    );
    await user.click(screen.getByRole('button', { name: '신고 접수' }));

    expect(await screen.findByText('신고를 접수했어요.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/test/exec',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
