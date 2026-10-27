import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import { AffiliateCatalogSlot } from './AffiliateCatalogSlot';

describe('AffiliateCatalogSlot', () => {
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
});
