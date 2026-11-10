import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import { StoreDetailOverview } from './StoreDetailOverview';
import { StoreUpdatedAt } from './StoreVisitInfo';

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

  it('사진을 넘기면 장수와 이전·다음 버튼 상태를 갱신한다', () => {
    render(<StoreDetailOverview store={store} />);
    expect(screen.getByLabelText('현재 매장 사진')).toHaveTextContent('1 / 3');
    expect(
      screen.getByRole('button', { name: '이전 매장 사진' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '다음 매장 사진' }));
    expect(screen.getByLabelText('현재 매장 사진')).toHaveTextContent('2 / 3');
    const track = screen.getByLabelText('좌우 방향키로 매장 사진 넘기기');
    fireEvent.keyDown(track, { key: 'ArrowRight' });
    expect(screen.getByLabelText('현재 매장 사진')).toHaveTextContent('3 / 3');
    expect(
      screen.getByRole('button', { name: '다음 매장 사진' }),
    ).toBeDisabled();
    fireEvent.error(
      screen.getByRole('img', { name: '테스트 매장 매장 사진 3' }),
    );
    expect(screen.getByLabelText('현재 매장 사진')).toHaveTextContent('1 / 2');
  });

  it('결제·운영·편의시설은 방문 정보에 표시하고 갱신일은 별도로 표시한다', () => {
    render(
      <StoreDetailOverview
        store={{
          ...store,
          businessHours: '매일 12:00 - 21:00',
          paymentMethods: '카드, 카드, 현금',
          kujiAmount: 21,
          facilities: ['주차 가능'],
          hasRandomBox: true,
        }}
      />,
    );
    expect(screen.getByRole('region', { name: '방문 정보' })).toHaveTextContent(
      '카드 · 현금',
    );
    expect(screen.getByText('쿠지 21개')).toBeInTheDocument();
    expect(screen.getByText('주차 가능, 랜덤박스')).toBeInTheDocument();
    expect(screen.getByText('정보 갱신 2026년 10월 1일')).toBeInTheDocument();
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

describe('매장 정보 갱신일', () => {
  it.each(['2026-10-01T00:00:00+09:00', '2026-09-30T15:00:00Z'])(
    '동일한 순간을 한국 날짜로 표시한다: %s',
    (updatedAt) => {
      render(<StoreUpdatedAt updatedAt={updatedAt} />);
      expect(screen.getByText('정보 갱신 2026년 10월 1일')).toBeInTheDocument();
    },
  );
});
