import { beforeEach, describe, expect, it } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import TradeDetail from './TradeDetail';
import { TRADE_DETAIL } from '../../storybook/tradeDetailMocks';

describe('TradeDetail', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('게시글의 채팅하기 링크만 보여준다', () => {
    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '채팅하기' })).toHaveAttribute(
      'href',
      `/chat/start/${TRADE_DETAIL.tradeId}`,
    );
    expect(
      screen.queryByRole('button', { name: '교환 제안하기' }),
    ).not.toBeInTheDocument();
  });

  it('작성자에게는 채팅하기 대신 수정하기 링크를 보여준다', () => {
    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} action="edit" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '수정하기' })).toHaveAttribute(
      'href',
      `/trade/${TRADE_DETAIL.tradeId}/edit`,
    );
    expect(
      screen.queryByRole('link', { name: '채팅하기' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '교환 상태' })).toHaveValue(
      TRADE_DETAIL.status,
    );
  });

  it('작성자가 상태를 변경하면 상세 화면에 즉시 반영한다', async () => {
    const user = userEvent.setup();
    let requestBody: unknown = null;

    server.use(
      http.patch(
        `/api/v1/trades/${TRADE_DETAIL.tradeId}/status`,
        async ({ request }) => {
          requestBody = await request.json();

          return HttpResponse.json({
            code: 'C002',
            message: '정상 수정',
            data: { ...TRADE_DETAIL, status: 'COMPLETED' },
          });
        },
      ),
    );

    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} action="edit" />
      </MemoryRouter>,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: '교환 상태' }),
      'COMPLETED',
    );

    expect(requestBody).toEqual({ status: 'COMPLETED' });
    await waitFor(() => {
      expect(screen.getByText(/· 교환 완료/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('상태 변경에 실패하면 이전 상태로 되돌리고 오류를 보여준다', async () => {
    const user = userEvent.setup();

    server.use(
      http.patch(`/api/v1/trades/${TRADE_DETAIL.tradeId}/status`, () =>
        HttpResponse.json(
          { code: 'T003', message: '작성자만 상태를 변경할 수 있습니다.' },
          { status: 403 },
        ),
      ),
    );

    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} action="edit" />
      </MemoryRouter>,
    );

    const statusSelect = screen.getByRole('combobox', { name: '교환 상태' });

    await user.selectOptions(statusSelect, 'COMPLETED');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '작성자만 상태를 변경할 수 있습니다.',
    );
    expect(statusSelect).toHaveValue('AVAILABLE');
  });

  it('작성자가 아니면 상태 선택 UI를 보여주지 않는다', () => {
    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} action="chat" />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('combobox', { name: '교환 상태' }),
    ).not.toBeInTheDocument();
  });

  it('로그인 상태를 확인하는 동안에는 액션을 표시하지 않는다', () => {
    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} action={null} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('link', { name: /채팅하기|수정하기/ }),
    ).not.toBeInTheDocument();
  });

  it('채팅하기를 누르면 문서 새로고침 없이 채팅 시작 경로로 이동한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[`/trade/${TRADE_DETAIL.tradeId}`]}>
        <Routes>
          <Route
            path="/trade/:tradeId"
            element={<TradeDetail detail={TRADE_DETAIL} />}
          />
          <Route path="/chat/start/:tradeId" element={<ChatLocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: '채팅하기' }));

    expect(screen.getByText('채팅방 확인 중')).toBeInTheDocument();
    expect(screen.getByTestId('background-path')).toHaveTextContent(
      `/trade/${TRADE_DETAIL.tradeId}`,
    );
  });
});

function ChatLocationProbe() {
  const location = useLocation();
  const state = location.state as {
    backgroundLocation?: { pathname: string };
  };

  return (
    <>
      <p>채팅방 확인 중</p>
      <span data-testid="background-path">
        {state.backgroundLocation?.pathname}
      </span>
    </>
  );
}
