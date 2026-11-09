import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/renderWithProviders';

import { SearchRoute } from './route';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
  syncAnalyticsUser: jest.fn(),
}));

jest.mock('./routing/useSearchRouteNavigation', () => ({
  useSearchRouteNavigation: () => ({
    activeSearch: '',
    selectGacha: jest.fn(),
  }),
}));

jest.mock('./selectedGacha/useSearchResults', () => ({
  useSearchResults: () => ({
    selectedGachaId: null,
    selectedGacha: {
      status: 'idle',
      data: null,
      errorMessage: null,
    },
  }),
}));

jest.mock('./storeResults/useSearchStores', () => ({
  useSearchStores: () => ({
    storesState: {
      status: 'idle',
      data: null,
      errorMessage: null,
    },
    retryStores: jest.fn(),
  }),
}));

jest.mock('./storeResults/useStoreSearchArea', () => ({
  useStoreSearchArea: () => ({
    searchCenter: { latitude: 37.5563, longitude: 126.9236 },
    viewportCenter: { latitude: 37.5563, longitude: 126.9236 },
    isSearchAreaChanged: false,
    updateViewportCenter: jest.fn(),
    commitViewportCenter: jest.fn(),
    resetSearchArea: jest.fn(),
  }),
}));

jest.mock('./storeResults/StoreResultsSection', () => ({
  StoreResultsSection: ({ onToggleHeader }: { onToggleHeader: () => void }) => (
    <button type="button" onClick={onToggleHeader}>
      빈 지도 영역
    </button>
  ),
}));

describe('SearchRoute 지도 검색 진입', () => {
  it('지도에서 통합 검색의 가챠 탭으로 진입하고 하단 메뉴를 제공한다', () => {
    renderWithProviders(<SearchRoute />, {
      initialAccessToken: null,
      route: '/map',
    });

    expect(
      screen.getByRole('link', { name: '교환글, 가챠, 매장 검색' }),
    ).toHaveAttribute('href', '/search?tab=gacha');
    expect(
      screen.getByLabelText('하단 메뉴', { selector: 'nav' }),
    ).toBeInTheDocument();
  });

  it('빈 지도 영역을 눌러도 검색 진입을 유지한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchRoute />, {
      initialAccessToken: null,
      route: '/map',
    });

    await user.click(screen.getByRole('button', { name: '빈 지도 영역' }));

    expect(
      screen.getByRole('link', { name: '교환글, 가챠, 매장 검색' }),
    ).toBeInTheDocument();
  });
});
