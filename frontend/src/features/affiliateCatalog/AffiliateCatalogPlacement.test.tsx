import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import { AffiliateCatalogPlacement } from './AffiliateCatalogPlacement';
import type { AffiliateCatalog } from './affiliateCatalogType';

const CATALOG: AffiliateCatalog = {
  revision: 'test',
  items: [
    {
      id: 'affiliate-5621-test',
      title: '치이카와 굿즈',
      thumbnailUrl: 'https://image.example/chiikawa.jpg',
      affiliateUrl: 'https://naver.me/example',
      categories: [{ categoryId: 5621, name: '치이카와' }],
      placementPaths: ['/trade'],
      activeFrom: null,
      activeUntil: null,
      order: 1,
    },
  ],
};

describe('AffiliateCatalogPlacement', () => {
  it('일치하는 카테고리가 없으면 빈 레이아웃도 만들지 않는다', () => {
    const { container } = render(
      <AffiliateCatalogPlacement
        catalog={CATALOG}
        categoryNames={['산리오']}
        placementPath="/trade"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('제목의 독립된 카테고리 단어로 일치하면 이미지 검증을 시작한다', () => {
    const { container } = render(
      <AffiliateCatalogPlacement
        catalog={CATALOG}
        categoryNames={[]}
        title="미개봉 치이카와 키링 교환해요"
        placementPath="/trade"
      />,
    );

    expect(container.querySelector('img')).not.toBeNull();
  });
});
