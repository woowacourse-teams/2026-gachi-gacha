import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TradePlaceSearchDialog from './TradePlaceSearchDialog';

describe('TradePlaceSearchDialog', () => {
  it('구매 매장 검색에도 알맞은 안내 문구로 재사용할 수 있다', async () => {
    const loadSdk = jest.fn(async () => undefined);

    render(
      <TradePlaceSearchDialog
        open
        title="구매 매장 선택"
        description="가챠를 구매한 매장이나 지점명을 검색해주세요."
        loadSdk={loadSdk}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '구매 매장 선택' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('가챠를 구매한 매장이나 지점명을 검색해주세요.'),
    ).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('예: 홍대입구역')).toBeEnabled();
  });

  it('카카오 검색 결과에서 교환 장소를 선택한다', async () => {
    const loadSdk = jest.fn(async () => undefined);
    const searchPlaces = jest.fn(async (keyword: string) =>
      keyword
        ? [
            {
              id: 'place-1',
              name: '홍대입구역 8번 출구',
              address: '서울특별시 마포구 양화로 160',
              latitude: 37.557,
              longitude: 126.9245,
            },
          ]
        : [],
    );
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <TradePlaceSearchDialog
        open
        loadSdk={loadSdk}
        searchPlaces={searchPlaces}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    const searchInput = await screen.findByRole('searchbox', {
      name: '장소 검색어',
    });

    expect(loadSdk).toHaveBeenCalledTimes(1);

    await user.type(searchInput, '홍대입구역');
    await user.click(screen.getByRole('button', { name: '검색' }));
    await user.click(
      await screen.findByRole('button', { name: /홍대입구역 8번 출구/ }),
    );

    expect(searchPlaces).toHaveBeenCalledWith('홍대입구역');
    expect(onSelect).toHaveBeenCalledWith({
      name: '홍대입구역 8번 출구',
      address: '서울특별시 마포구 양화로 160',
      latitude: 37.557,
      longitude: 126.9245,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
