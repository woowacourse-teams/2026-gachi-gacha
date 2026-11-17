import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import ProductCard from './ProductCard';
import { TRADE_ITEMS } from '../../storybook/tradeMocks';

describe('ProductCard', () => {
  it('링크 이름에서 제목·카테고리·장소·등록 날짜·상태를 순서대로 구분한다', () => {
    const item = {
      ...TRADE_ITEMS[0]!,
      createdAt: new Date().toISOString(),
    };

    renderWithProviders(<ProductCard item={item} homeLayout />);

    const card = screen.getByRole('link', {
      name: /^교환글 제목: 산리오 캐릭터즈 캡슐토이 세트 카테고리: 산리오 · 피규어 희망 교환 장소: 신당역 교환글 등록 날짜: 방금 전 거래 상태: 교환 가능 좋아요 12 개 댓글 3 개$/,
    });

    expect(card).toHaveAttribute('href', `/trade/${item.tradeId}`);
    expect(card).not.toHaveAttribute('aria-label');
    expect(
      screen.getByRole('heading', { level: 3, name: item.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('교환글 제목:')).toHaveStyle({
      position: 'absolute',
      clipPath: 'inset(50%)',
    });
  });

  it('카테고리·장소·날짜가 없어도 값의 의미와 대체 안내를 함께 제공한다', () => {
    renderWithProviders(
      <ProductCard
        item={{
          ...TRADE_ITEMS[0]!,
          categories: [],
          tradePlace: null,
          createdAt: 'invalid-date',
        }}
      />,
    );

    expect(screen.getByRole('link')).toHaveAccessibleName(
      /카테고리: 카테고리 미설정 희망 교환 장소: 교환 장소 협의 교환글 등록 날짜: 등록일 확인 중 거래 상태: 교환 가능$/,
    );
  });

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

    renderWithProviders(<ProductCard item={item} eagerImage />);

    const thumbnailImage = screen.getByRole('link').querySelector('img');

    expect(thumbnailImage).toHaveAttribute('loading', 'eager');
    expect(thumbnailImage).toHaveAttribute('decoding', 'async');
    expect(thumbnailImage).not.toHaveAttribute('fetchpriority');
  });
});
