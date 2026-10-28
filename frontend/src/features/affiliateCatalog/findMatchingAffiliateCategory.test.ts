import { describe, expect, it } from '@jest/globals';

import type {
  AffiliateCatalog,
  AffiliateCatalogProduct,
} from './affiliateCatalogType';
import { findMatchingAffiliateCategory } from './findMatchingAffiliateCategory';

const CHIIKAWA_PRODUCT: AffiliateCatalogProduct = {
  id: 'affiliate-5621-test',
  title: '치이카와 굿즈',
  thumbnailUrl: 'https://image.example/chiikawa.jpg',
  affiliateUrl: 'https://naver.me/example',
  categories: [{ categoryId: 5621, name: '치이카와' }],
  placementPaths: ['/trade', '/map'],
  activeFrom: null,
  activeUntil: null,
  order: 1,
};

const CATALOG: AffiliateCatalog = {
  revision: 'test',
  items: [CHIIKAWA_PRODUCT],
};

const MULTI_CATEGORY_CATALOG: AffiliateCatalog = {
  revision: 'test',
  items: [
    {
      ...CHIIKAWA_PRODUCT,
      id: 'affiliate-5621-search-only',
      placementPaths: ['/search'],
    },
    {
      ...CHIIKAWA_PRODUCT,
      id: 'affiliate-7777-map',
      title: '키링 굿즈',
      categories: [{ categoryId: 7777, name: '키링' }],
      placementPaths: ['/map'],
    },
  ],
};

describe('findMatchingAffiliateCategory', () => {
  it('응답 카테고리명과 정확히 일치하는 활성 제휴 카테고리를 찾는다', () => {
    expect(
      findMatchingAffiliateCategory({
        catalog: CATALOG,
        categoryNames: ['피규어', '치이카와'],
        placementPath: '/map',
      }),
    ).toBe('치이카와');
  });

  it('카테고리 배열에 없어도 제목에 카테고리명이 포함되면 찾는다', () => {
    expect(
      findMatchingAffiliateCategory({
        catalog: CATALOG,
        categoryNames: [],
        title: '미개봉 치이카와 키링 교환해요',
        placementPath: '/trade',
      }),
    ).toBe('치이카와');
  });

  it('카테고리명이 제목의 합성어에 포함되어도 찾는다', () => {
    expect(
      findMatchingAffiliateCategory({
        catalog: CATALOG,
        categoryNames: [],
        title: '치이카와풍 키링 교환해요',
        placementPath: '/trade',
      }),
    ).toBe('치이카와');
  });

  it('제목과 카테고리가 무관하거나 해당 위치에 상품이 없으면 노출하지 않는다', () => {
    expect(
      findMatchingAffiliateCategory({
        catalog: CATALOG,
        categoryNames: [],
        title: '포켓몬 키링 교환해요',
        placementPath: '/trade',
      }),
    ).toBeNull();
    expect(
      findMatchingAffiliateCategory({
        catalog: CATALOG,
        categoryNames: ['치이카와'],
        placementPath: '/search',
      }),
    ).toBeNull();
  });

  it('첫 카테고리에 현재 위치 상품이 없으면 다음 일치 카테고리를 사용한다', () => {
    expect(
      findMatchingAffiliateCategory({
        catalog: MULTI_CATEGORY_CATALOG,
        categoryNames: ['치이카와', '키링'],
        placementPath: '/map',
      }),
    ).toBe('키링');
  });
});
