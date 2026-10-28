import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import CardListSection from './CardListSection';

describe('CardListSection', () => {
  it('카테고리 상품이 없으면 조사 중임을 안내한다', () => {
    render(<CardListSection title="산리오" items={[]} />);

    expect(screen.getByText('상품 조사 중이에요.')).toBeInTheDocument();
    expect(
      screen.queryByText('이 카테고리에는 아직 상품이 없어요.'),
    ).not.toBeInTheDocument();
  });
});
