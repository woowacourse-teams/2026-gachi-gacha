import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import ProductCard from './ProductCard';
import { TRADE_ITEMS } from '../../storybook/tradeMocks';

describe('ProductCard', () => {
  it('긴 제목과 카테고리를 유지하면서 거래 상태를 공용 배지로 표시한다', () => {
    const item = {
      ...TRADE_ITEMS[0]!,
      title: '두 줄 이상이 될 수 있는 긴 교환 게시글 제목입니다',
      categories: ['프로젝트 세카이 컬러풀 스테이지', '하츠네 미쿠'],
      status: 'IN_PROGRESS' as const,
    };

    renderWithProviders(<ProductCard item={item} />);

    expect(
      screen.getByRole('heading', { name: item.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('교환 진행 중')).toBeInTheDocument();
  });
});
