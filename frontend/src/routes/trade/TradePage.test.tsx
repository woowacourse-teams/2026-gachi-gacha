import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import { TRADE_ITEMS } from './storybook/tradeMocks';
import TradePage from './TradePage';

describe('TradePage 접근성 탐색 순서', () => {
  it('모바일 글쓰기 링크를 20개 카드와 더보기보다 먼저 탐색하도록 배치한다', () => {
    const items = Array.from({ length: 20 }, (_, index) => ({
      ...TRADE_ITEMS[0]!,
      tradeId: index + 1,
    }));

    renderWithProviders(
      <TradePage items={items} hasMore onLoadMore={() => undefined} />,
      { route: '/trade' },
    );

    // jsdom은 모바일 미디어 쿼리를 적용하지 않으므로 해당 링크의 DOM 순서를 검증한다.
    const mobileWriteLink = screen.getByLabelText('교환 글쓰기', {
      selector: 'a[data-placement="mobile"]',
    });
    const main = screen.getByRole('main');
    const loadMore = screen.getByRole('button', { name: '더보기' });
    const cards = screen.getAllByRole('link', { name: /^교환글 제목:/ });

    expect(cards).toHaveLength(20);
    for (const nextElement of [main, ...cards, loadMore]) {
      expect(
        mobileWriteLink.compareDocumentPosition(nextElement) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    expect(mobileWriteLink).toHaveAttribute('href', '/trade/new');
    expect(mobileWriteLink).toHaveStyle({ position: 'fixed' });
    expect(mobileWriteLink).not.toHaveAttribute('tabindex');
  });
});
