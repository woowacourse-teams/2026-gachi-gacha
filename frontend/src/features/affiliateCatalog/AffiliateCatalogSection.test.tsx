import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { AffiliateCatalogSection } from './AffiliateCatalogSection';
import type { AffiliateCatalog } from './affiliateCatalogType';

const CATALOG: AffiliateCatalog = {
  revision: 'test',
  items: [
    {
      id: 'affiliate-110-test',
      title: '산리오 굿즈',
      thumbnailUrl: 'https://image.example/sanrio.jpg',
      affiliateUrl: 'https://naver.me/example',
      categories: [{ categoryId: 110, name: '산리오' }],
      placementPaths: ['/search'],
      activeFrom: null,
      activeUntil: null,
      order: 1,
    },
    {
      id: 'affiliate-5621-test',
      title: '치이카와 굿즈',
      thumbnailUrl: 'https://image.example/chiikawa.jpg',
      affiliateUrl: 'https://naver.me/chiikawa',
      categories: [{ categoryId: 5621, name: '치이카와' }],
      placementPaths: ['/search'],
      activeFrom: null,
      activeUntil: null,
      order: 2,
    },
  ],
};

describe('AffiliateCatalogSection', () => {
  it('썸네일을 불러온 상품만 제휴 카드로 노출한다', () => {
    const { container } = render(
      <AffiliateCatalogSection
        categoryName="산리오"
        placementPath="/search"
        catalog={CATALOG}
      />,
    );
    const preloadedImage = container.querySelector('img');

    expect(screen.queryByText('산리오 굿즈')).not.toBeInTheDocument();
    expect(preloadedImage).not.toBeNull();

    fireEvent.load(preloadedImage as HTMLImageElement);

    expect(screen.getByText('산리오 굿즈')).toBeInTheDocument();
    expect(
      screen.getByText(
        '이 굿즈들은 네이버 쇼핑 커넥트 제휴로, 판매 발생 시 수수료를 제공받습니다.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /산리오 굿즈/ })).toHaveAttribute(
      'rel',
      'sponsored noopener noreferrer',
    );
  });

  it('썸네일 로드가 실패한 상품은 섹션과 함께 노출하지 않는다', () => {
    const { container } = render(
      <AffiliateCatalogSection
        categoryName="산리오"
        placementPath="/search"
        catalog={CATALOG}
      />,
    );
    const preloadedImage = container.querySelector('img');

    fireEvent.error(preloadedImage as HTMLImageElement);

    expect(screen.queryByText(/네이버 쇼핑에서 파는/)).not.toBeInTheDocument();
    expect(screen.queryByText('산리오 굿즈')).not.toBeInTheDocument();
  });

  it('카테고리를 연속으로 변경해도 현재 상품을 노출한다', () => {
    const { container, rerender } = render(
      <AffiliateCatalogSection
        categoryName="산리오"
        placementPath="/search"
        catalog={CATALOG}
      />,
    );

    fireEvent.load(
      container.querySelector(
        'img[src="https://image.example/sanrio.jpg"]',
      ) as HTMLImageElement,
    );
    expect(screen.getByText('산리오 굿즈')).toBeInTheDocument();

    rerender(
      <AffiliateCatalogSection
        categoryName="치이카와"
        placementPath="/search"
        catalog={CATALOG}
      />,
    );
    fireEvent.load(
      container.querySelector(
        'img[src="https://image.example/chiikawa.jpg"]',
      ) as HTMLImageElement,
    );
    expect(screen.getByText('치이카와 굿즈')).toBeInTheDocument();

    rerender(
      <AffiliateCatalogSection
        categoryName="산리오"
        placementPath="/search"
        catalog={CATALOG}
      />,
    );
    fireEvent.load(
      container.querySelector(
        'img[src="https://image.example/sanrio.jpg"]',
      ) as HTMLImageElement,
    );
    expect(screen.getByText('산리오 굿즈')).toBeInTheDocument();
  });
});
