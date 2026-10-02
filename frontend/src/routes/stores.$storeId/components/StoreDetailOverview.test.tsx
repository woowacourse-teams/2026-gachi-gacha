import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import { StoreDetailOverview } from './StoreDetailOverview';

jest.mock('./StoreGachaCatalog', () => ({
  StoreGachaCatalog: () => null,
}));

const store = {
  storeId: 1,
  name: '테스트 매장',
  address: '서울시 테스트구',
  businessHours: null,
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  images: [
    {
      storeImageId: 1,
      imageUrl: 'https://example.com/first.jpg',
    },
    {
      storeImageId: 2,
      imageUrl: 'https://example.com/second.jpg',
    },
  ],
  phoneNumber: null,
  instagramId: null,
  paymentMethods: null,
  facilities: [],
  gachaMachineAmount: null,
  kujiAmount: null,
  coinPrice: null,
  gachaPriceMin: null,
  gachaPriceMax: null,
  kujiPriceMin: null,
  kujiPriceMax: null,
  selectGachaPriceMin: null,
  selectGachaPriceMax: null,
  hasRandomBox: false,
  hasSelectGacha: null,
  updatedAt: '2026-10-01T00:00:00+09:00',
} satisfies StoreDetailResponseDto;

describe('StoreDetailOverview', () => {
  it('불러오지 못한 사진은 갤러리에서 제외한다', () => {
    render(<StoreDetailOverview store={store} />);

    fireEvent.error(
      screen.getByRole('img', { name: '테스트 매장 매장 사진 3' }),
    );

    expect(
      screen.queryByRole('img', { name: '테스트 매장 매장 사진 3' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '테스트 매장 매장 사진 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '테스트 매장 매장 사진 2' }),
    ).toHaveAttribute('src', 'https://example.com/first.jpg');
  });

  it('모든 사진을 불러오지 못하면 사진 준비중 상태를 표시한다', () => {
    render(<StoreDetailOverview store={store} />);

    let remainingImage = screen
      .queryAllByRole('img', { name: /테스트 매장 매장 사진/ })
      .at(0);

    while (remainingImage) {
      fireEvent.error(remainingImage);
      remainingImage = screen
        .queryAllByRole('img', { name: /테스트 매장 매장 사진/ })
        .at(0);
    }

    expect(screen.getByText('매장 사진을 준비하고 있어요')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /매장 사진 크게 보기/ }),
    ).not.toBeInTheDocument();
  });
});
