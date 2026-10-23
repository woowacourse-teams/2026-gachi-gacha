import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import TradeDetail from './TradeDetail';
import { TRADE_DETAIL } from '../../storybook/tradeDetailMocks';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
}));

const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);

beforeEach(() => {
  mockedCaptureAnalyticsEvent.mockReset();
});

describe('TradeDetail', () => {
  it('가지고 있는 상품과 얻고 싶은 상품을 명확히 구분한다', () => {
    render(
      <MemoryRouter>
        <TradeDetail detail={TRADE_DETAIL} />
      </MemoryRouter>,
    );

    expect(screen.getByText('가지고 있는 것')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '가지고 있는 상품 설명' }),
    ).toBeInTheDocument();
    expect(screen.getByText('얻고 싶은 것')).toBeInTheDocument();
    expect(
      screen.getByText('시나모롤 키링 또는 산리오 랜덤 피규어'),
    ).toBeInTheDocument();
  });

  it('상품 사진을 좌우로 넘기고 선택한 사진을 크게 본다', async () => {
    const user = userEvent.setup();
    const detail = {
      ...TRADE_DETAIL,
      imageUrls: [
        'https://example.com/trade-first.jpg',
        'https://example.com/trade-second.jpg',
      ],
    };

    render(
      <MemoryRouter>
        <TradeDetail detail={detail} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('img', { name: `${detail.title} 상품 사진 1` }),
    ).toHaveAttribute('src', detail.imageUrls[0]);

    await user.click(screen.getByRole('button', { name: '다음 상품 사진' }));

    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'trade_detail_photo_selected',
      {
        trade_id: detail.tradeId,
        photo_index: 1,
        photo_count: 2,
        source: 'gallery_next',
      },
    );

    expect(
      screen.getByRole('img', { name: `${detail.title} 상품 사진 2` }),
    ).toHaveAttribute('src', detail.imageUrls[1]);

    await user.click(
      screen.getByRole('button', { name: '2번째 상품 사진 크게 보기' }),
    );

    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'trade_detail_photo_viewer_opened',
      {
        trade_id: detail.tradeId,
        photo_index: 1,
        photo_count: 2,
      },
    );

    const dialog = screen.getByRole('dialog', {
      name: `${detail.title} 상품 사진 크게 보기`,
    });

    expect(
      within(dialog).getByRole('img', {
        name: `${detail.title} 상품 사진 2`,
      }),
    ).toHaveAttribute('src', detail.imageUrls[1]);

    await user.click(
      within(dialog).getByRole('button', {
        name: '상품 사진 크게 보기 닫기',
      }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
