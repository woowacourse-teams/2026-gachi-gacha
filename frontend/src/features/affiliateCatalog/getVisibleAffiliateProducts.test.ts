import { describe, expect, it } from '@jest/globals';

import type { AffiliateCatalog } from './affiliateCatalogType';
import { getVisibleAffiliateProducts } from './getVisibleAffiliateProducts';

const CATALOG: AffiliateCatalog = {
  revision: 'test',
  items: [
    {
      id: 'affiliate-110-a',
      title: '산리오 굿즈',
      thumbnailUrl: 'https://image.example/sanrio.jpg',
      affiliateUrl: 'https://naver.me/example-a',
      categories: [{ categoryId: 110, name: '산리오' }],
      placementPaths: ['/search'],
      activeFrom: '2026-10-01',
      activeUntil: '2026-10-31',
      order: 2,
    },
    {
      id: 'affiliate-110-b',
      title: '산리오 피규어',
      thumbnailUrl: 'https://image.example/figure.jpg',
      affiliateUrl: 'https://naver.me/example-b',
      categories: [
        { categoryId: 6, name: '피규어' },
        { categoryId: 110, name: '산리오' },
      ],
      placementPaths: ['/search', '/trade/12'],
      activeFrom: null,
      activeUntil: null,
      order: 1,
    },
  ],
};

describe('getVisibleAffiliateProducts', () => {
  it('한국 날짜의 노출 기간과 카테고리, 경로가 맞는 상품을 시트 순서로 반환한다', () => {
    const products = getVisibleAffiliateProducts({
      catalog: CATALOG,
      categoryName: ' 산리오 ',
      placementPath: '/search/',
      now: new Date('2026-10-15T15:00:00.000Z'),
    });

    expect(products.map(({ id }) => id)).toEqual([
      'affiliate-110-b',
      'affiliate-110-a',
    ]);
  });

  it('한국 시간으로 종료일이 지나면 상품을 제외한다', () => {
    const products = getVisibleAffiliateProducts({
      catalog: CATALOG,
      categoryName: '산리오',
      placementPath: '/search',
      now: new Date('2026-10-31T15:00:00.000Z'),
    });

    expect(products.map(({ id }) => id)).toEqual(['affiliate-110-b']);
  });
});
