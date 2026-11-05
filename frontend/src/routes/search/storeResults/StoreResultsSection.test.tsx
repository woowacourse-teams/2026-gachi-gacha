import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StoreResultsSection } from './StoreResultsSection';
import { nearbyStoresMockResponse } from '../mocks/nearbyStoresMock';

jest.mock('./analytics/storeResultsAnalytics', () => ({
  captureStoreOpened: jest.fn(),
  captureStoreSelected: jest.fn(),
}));

jest.mock('./list/StoreListPanel', () => ({
  StoreListPanel: ({
    onSelectStore,
  }: {
    onSelectStore: (storeId: number) => void;
  }) => (
    <button type="button" onClick={() => onSelectStore(1)}>
      매장 카드
    </button>
  ),
}));

jest.mock('./map/StoreMapPanel', () => ({
  StoreMapPanel: ({
    onBackgroundClick,
    onSearchArea,
    onSelectStore,
  }: {
    onBackgroundClick: () => void;
    onSearchArea: () => void;
    onSelectStore: (storeId: number) => void;
  }) => (
    <div>
      <button type="button" onClick={onBackgroundClick}>
        빈 지도 영역
      </button>
      <button type="button" onClick={() => onSelectStore(1)}>
        지도 마커
      </button>
      <button type="button" onClick={onSearchArea}>
        이 지역에서 재검색
      </button>
      <button type="button">지도 확대</button>
    </div>
  ),
}));

const center = { latitude: 37.5563, longitude: 126.9236 };
const noop = jest.fn();

function setMobileViewport(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches }),
  });
}

function renderSection(onToggleHeader: () => void) {
  return render(
    <StoreResultsSection
      center={center}
      gachaId={null}
      storesState={{
        status: 'success',
        data: nearbyStoresMockResponse.data,
        errorMessage: null,
      }}
      isSearchAreaChanged
      onOpenStore={noop}
      onRetry={noop}
      onToggleHeader={onToggleHeader}
      onSearchArea={noop}
      onViewportCenterChange={noop}
    />,
  );
}

describe('StoreResultsSection 모바일 지도 상호작용', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('모바일의 빈 지도 영역만 헤더 토글로 처리한다', async () => {
    setMobileViewport(true);
    const user = userEvent.setup();
    const onToggleHeader = jest.fn();

    renderSection(onToggleHeader);

    await user.click(screen.getByRole('button', { name: '빈 지도 영역' }));

    expect(onToggleHeader).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: '지도 마커' }));
    await user.click(screen.getByRole('button', { name: '매장 카드' }));
    await user.click(
      screen.getByRole('button', { name: '이 지역에서 재검색' }),
    );
    await user.click(screen.getByRole('button', { name: '지도 확대' }));

    expect(onToggleHeader).toHaveBeenCalledTimes(1);
  });

  it('데스크톱의 지도 클릭은 헤더 상태를 바꾸지 않는다', async () => {
    setMobileViewport(false);
    const user = userEvent.setup();
    const onToggleHeader = jest.fn();

    renderSection(onToggleHeader);

    await user.click(screen.getByRole('button', { name: '빈 지도 영역' }));

    expect(onToggleHeader).not.toHaveBeenCalled();
  });
});
