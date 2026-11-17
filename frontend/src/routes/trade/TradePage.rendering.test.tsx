import type { PropsWithChildren } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { ToastProvider } from '@/shared/ui/toast';

import ProductCard from './components/ProductCard';
import { TRADE_ITEMS } from './storybook/tradeMocks';
import TradePage from './TradePage';

jest.mock('./components/ProductCard', () => {
  const actual = jest.requireActual<typeof import('./components/ProductCard')>(
    './components/ProductCard',
  );

  return { __esModule: true, ...actual, default: jest.fn(actual.default) };
});

function Providers({ children }: PropsWithChildren) {
  return (
    <MemoryRouter initialEntries={['/trade']}>
      <AuthSessionProvider initialAccessToken={null}>
        <ToastProvider>{children}</ToastProvider>
      </AuthSessionProvider>
    </MemoryRouter>
  );
}

const NOW = Date.parse('2026-11-12T03:00:00Z');

describe('TradePage 카드 렌더링 경계', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('더보기 로딩과 페이지 추가 때 변경 없는 기존 카드는 다시 렌더링하지 않는다', () => {
    const first = TRADE_ITEMS[0]!;
    const next = TRADE_ITEMS[1]!;
    const onOpenTrade = jest.fn();
    const onLoadMore = jest.fn();
    const { rerender } = render(
      <TradePage
        items={[first]}
        onOpenTrade={onOpenTrade}
        hasMore
        onLoadMore={onLoadMore}
      />,
      { wrapper: Providers },
    );

    expect(ProductCard).toHaveBeenCalledTimes(1);

    rerender(
      <TradePage
        items={[first]}
        onOpenTrade={onOpenTrade}
        hasMore
        isLoadingMore
        onLoadMore={onLoadMore}
      />,
    );

    expect(
      screen.getByRole('button', { name: '불러오는 중...' }),
    ).toBeDisabled();
    expect(ProductCard).toHaveBeenCalledTimes(1);

    rerender(<TradePage items={[first, next]} onOpenTrade={onOpenTrade} />);

    expect(ProductCard).toHaveBeenCalledTimes(2);
    expect(jest.mocked(ProductCard).mock.calls[1]![0].item).toBe(next);
    expect(
      screen.getByRole('heading', { name: first.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(next.title) }),
    ).toHaveAttribute('href', `/trade/${next.tradeId}`);
  });

  it('같은 ID의 데이터가 바뀌면 해당 카드와 접근성 이름을 갱신한다', () => {
    const first = TRADE_ITEMS[0]!;
    const second = TRADE_ITEMS[1]!;
    const { rerender } = render(<TradePage items={[first, second]} />, {
      wrapper: Providers,
    });
    const updated = {
      ...first,
      title: '수정한 교환 게시글',
      status: 'COMPLETED' as const,
      categories: ['키링'],
      tradePlace: { name: '강남역', address: '서울 강남구' },
      createdAt: new Date(NOW).toISOString(),
      thumbnailUrl: 'https://example.com/updated.jpg',
      likeCount: 13,
      commentCount: 4,
    };

    rerender(<TradePage items={[updated, second]} />);

    expect(ProductCard).toHaveBeenCalledTimes(3);
    const card = screen.getByRole('link', {
      name: '교환글 제목: 수정한 교환 게시글 카테고리: 키링 희망 교환 장소: 강남역 교환글 등록 날짜: 방금 전 거래 상태: 교환 완료 좋아요 13 개 댓글 4 개',
    });
    expect(card).toHaveAttribute('href', `/trade/${first.tradeId}`);
    expect(card.querySelector('img')).toHaveAttribute(
      'src',
      updated.thumbnailUrl,
    );
    expect(
      screen.queryByRole('heading', { name: first.title }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [59_999, '방금 전', '1분 전'],
    [3_599_999, '59분 전', '1시간 전'],
    [86_399_999, '23시간 전', '1일 전'],
  ])(
    '등록 후 %i ms에서 시간 경계를 지나 부모가 갱신되면 표시와 링크 이름을 갱신한다',
    (elapsed, before, after) => {
      const item = {
        ...TRADE_ITEMS[0]!,
        createdAt: new Date(NOW - elapsed).toISOString(),
      };
      const { rerender } = render(<TradePage items={[item]} />, {
        wrapper: Providers,
      });

      expect(
        screen.getByRole('link', { name: /^교환글 제목:/ }),
      ).toHaveAccessibleName(
        new RegExp(`교환글 등록 날짜: ${before} 거래 상태:`),
      );

      jest.mocked(Date.now).mockReturnValue(NOW + 1);
      rerender(<TradePage items={[item]} isLoadingMore />);

      expect(ProductCard).toHaveBeenCalledTimes(2);
      expect(screen.getByText(after)).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /^교환글 제목:/ }),
      ).toHaveAccessibleName(
        new RegExp(`교환글 등록 날짜: ${after} 거래 상태:`),
      );
    },
  );
});
