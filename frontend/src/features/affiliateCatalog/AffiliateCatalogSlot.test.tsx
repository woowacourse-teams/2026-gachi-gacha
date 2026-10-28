import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { AffiliateCatalogSlot } from './AffiliateCatalogSlot';

jest.mock('./AffiliateCatalogRuntime', () => ({
  AffiliateCatalogRuntime: (props: { matchBy: string }) => (
    <div data-testid="affiliate-catalog-runtime">{props.matchBy}</div>
  ),
}));

const affiliateCatalogEnvironment = globalThis as typeof globalThis & {
  __AFFILIATE_CATALOG_ENABLED__: boolean;
};

describe('AffiliateCatalogSlot', () => {
  afterEach(() => {
    affiliateCatalogEnvironment.__AFFILIATE_CATALOG_ENABLED__ = false;
  });

  it('기능이 비활성화되면 기존 화면에 레이아웃을 만들지 않는다', () => {
    const { container } = render(
      <AffiliateCatalogSlot
        matchBy="category"
        categoryName="산리오"
        placementPath="/search"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('런타임을 불러온 뒤 화면에 다시 진입해도 컴포넌트를 props와 함께 렌더링한다', async () => {
    affiliateCatalogEnvironment.__AFFILIATE_CATALOG_ENABLED__ = true;
    const firstRender = render(
      <AffiliateCatalogSlot
        matchBy="category"
        categoryName="치이카와"
        placementPath="/search"
      />,
    );

    expect(
      await screen.findByTestId('affiliate-catalog-runtime'),
    ).toHaveTextContent('category');
    firstRender.unmount();

    render(
      <AffiliateCatalogSlot
        matchBy="category"
        categoryName="치이카와"
        placementPath="/search"
      />,
    );

    expect(screen.getByTestId('affiliate-catalog-runtime')).toHaveTextContent(
      'category',
    );
  });
});
