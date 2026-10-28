import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CardListSection from './CardListSection';

describe('CardListSection', () => {
  it('카테고리 상품이 없으면 조사 중임을 안내한다', () => {
    render(<CardListSection title="산리오" items={[]} />);

    expect(screen.getByText('상품 조사 중이에요.')).toBeInTheDocument();
    expect(
      screen.queryByText('이 카테고리에는 아직 상품이 없어요.'),
    ).not.toBeInTheDocument();
  });

  it('다음 페이지를 자동으로 불러오지 않고 명시적인 더보기 버튼을 제공한다', async () => {
    const user = userEvent.setup();
    const onEndReached = jest.fn();

    render(
      <CardListSection
        title="산리오"
        items={[
          {
            gachaId: 1,
            name: '산리오 가챠',
            thumbnailUrl: null,
            categories: ['산리오'],
          },
        ]}
        hasNextPage
        loadMoreStatus="idle"
        onEndReached={onEndReached}
      />,
    );

    expect(onEndReached).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '가챠 더보기' }));
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });
});
