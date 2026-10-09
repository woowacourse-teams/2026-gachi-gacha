import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import TradeDetail from './TradeDetail';
import { TRADE_DETAIL } from '../../storybook/tradeDetailMocks';

describe('TradeDetail', () => {
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

  it('작성자에게는 채팅하기 대신 수정하기 링크와 조회용 상태를 보여준다', () => {
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
    expect(screen.getByText('교환 가능')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /교환 상태:/ }),
    ).not.toBeInTheDocument();
  });

  it('작성자가 아니면 상태 선택 UI를 보여주지 않는다', () => {
    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} action="chat" />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('button', { name: /교환 상태:/ }),
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
