import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import Card from './Card';

const product = {
  gachaId: 42,
  name: '산리오 스탠드 피규어',
  thumbnailUrl: 'https://example.com/gacha.jpg',
  categories: ['산리오'],
};

describe('홈 가챠 카드', () => {
  it('썸네일과 이름을 선택할 수 있는 하나의 검색 결과 링크를 제공한다', () => {
    render(<Card product={product} />);

    const link = screen.getByRole('link', { name: product.name });
    const name = screen.getByText(product.name);
    const thumbnail = link.querySelector('img');

    expect(link).toHaveAttribute('href', '/map?gachaId=42');
    expect(link).toContainElement(name);
    expect(link).toContainElement(thumbnail);
  });
});
