import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import ProductCard from './ProductCard';
import { TRADE_ITEMS } from '../../storybook/tradeMocks';

describe('ProductCard', () => {
  it('제목과 카테고리는 상단에, 거래 정보는 카드 하단에 묶어 표시한다', () => {
    const item = {
      ...TRADE_ITEMS[0]!,
      title: '두 줄 이상이 될 수 있는 긴 교환 게시글 제목입니다',
      categories: ['프로젝트 세카이 컬러풀 스테이지', '하츠네 미쿠'],
      status: 'IN_PROGRESS' as const,
      thumbnailUrl: 'https://example.com/trade-thumbnail.jpg',
    };

    renderWithProviders(<ProductCard item={item} />);

    expect(
      screen.getByRole('heading', { name: item.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('교환 진행 중')).toBeInTheDocument();

    const card = screen.getByRole('link');
    const thumbnailImage = card.querySelector(
      `img[src="${item.thumbnailUrl}"]`,
    );
    const thumbnail = thumbnailImage?.parentElement;
    const title = screen.getByRole('heading', {
      name: item.title,
    });
    const primaryInfo = title.parentElement;
    const tradeInfo = screen.getByText('신당역').parentElement;

    expect(thumbnail).toHaveStyle({ marginBottom: '12px' });
    expect(thumbnailImage).toHaveAttribute('loading', 'lazy');
    expect(thumbnailImage).toHaveAttribute('decoding', 'async');
    expect(primaryInfo).toContainElement(
      screen.getByText(item.categories.join(' · ')),
    );
    expect(primaryInfo).toHaveStyle({ gap: '12px' });
    expect(tradeInfo).toContainElement(screen.getByText('교환 진행 중'));
    expect(tradeInfo).toHaveStyle({
      marginTop: 'auto',
      paddingTop: '12px',
      gap: '12px',
    });
  });

  it('우선 로딩 대상 이미지를 즉시 로딩한다', () => {
    const item = {
      ...TRADE_ITEMS[0]!,
      thumbnailUrl: 'https://example.com/trade-thumbnail.jpg',
    };

    renderWithProviders(<ProductCard item={item} prioritizeImage />);

    const thumbnailImage = screen.getByRole('link').querySelector('img');

    expect(thumbnailImage).toHaveAttribute('loading', 'eager');
    expect(thumbnailImage).toHaveAttribute('decoding', 'async');
    expect(thumbnailImage).toHaveAttribute('fetchpriority', 'high');
  });
});
