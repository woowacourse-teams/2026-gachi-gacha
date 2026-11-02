import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { StoreMapPanel } from './StoreMapPanel';
import { nearbyStoresMockResponse } from '../../mocks/nearbyStoresMock';

let mockedSelectStoreFromMarker: ((storeId: number) => void) | undefined;

jest.mock('@/shared/map/KakaoMap', () => ({
  KakaoMap: ({ onBackgroundClick }: { onBackgroundClick: () => void }) => (
    <div>
      <button type="button" onClick={onBackgroundClick}>
        빈 지도 영역
      </button>
      <button type="button">현재 위치로 이동</button>
    </div>
  ),
}));

jest.mock('./useStoreMarkers', () => ({
  useStoreMarkers: ({
    onSelectStore,
  }: {
    onSelectStore: (storeId: number) => void;
  }) => {
    mockedSelectStoreFromMarker = onSelectStore;
  },
}));

describe('StoreMapPanel 지도 조작 구분', () => {
  it('마커와 지도 컨트롤 조작을 빈 지도 클릭으로 처리하지 않는다', () => {
    const onBackgroundClick = jest.fn();
    const onSearchArea = jest.fn();
    const onSelectStore = jest.fn();

    render(
      <StoreMapPanel
        center={{ latitude: 37.5563, longitude: 126.9236 }}
        isGachaSelected={false}
        storesState={{
          status: 'success',
          data: nearbyStoresMockResponse.data,
          errorMessage: null,
        }}
        selectedStoreId={null}
        isSearchAreaChanged
        onBackgroundClick={onBackgroundClick}
        onSelectStore={onSelectStore}
        onViewportCenterChange={jest.fn()}
        onSearchArea={onSearchArea}
      />,
    );

    act(() => mockedSelectStoreFromMarker?.(1));
    fireEvent.click(screen.getByRole('button', { name: '빈 지도 영역' }));

    expect(onSelectStore).toHaveBeenCalledWith(1);
    expect(onBackgroundClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '현재 위치로 이동' }));
    fireEvent.click(screen.getByRole('button', { name: '이 지역에서 재검색' }));

    expect(onBackgroundClick).not.toHaveBeenCalled();
    expect(onSearchArea).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '빈 지도 영역' }));

    expect(onBackgroundClick).toHaveBeenCalledTimes(1);
  });
});
