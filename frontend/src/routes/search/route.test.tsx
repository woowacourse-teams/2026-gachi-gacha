import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/renderWithProviders';

import { SearchRoute } from './route';

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

describe('SearchRoute 모바일 지도 헤더', () => {
  it('문서를 스크롤하지 않고 헤더 레이어를 열고 닫는다', async () => {
    const user = userEvent.setup();
    const scrollToSpy = jest
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);

    renderWithProviders(<SearchRoute />, {
      initialAccessToken: null,
      route: '/map',
    });

    const headerLayer = screen.getByRole('banner').parentElement;
    const mapBackground = screen.getByRole('button', {
      name: '빈 지도 영역',
    });

    expect(headerLayer).toHaveAttribute('data-state', 'open');
    expect(headerLayer?.parentElement).toHaveStyle(
      '--mobile-map-header-offset: 120px',
    );

    await user.click(mapBackground);

    expect(headerLayer).toHaveAttribute('data-state', 'closed');
    expect(headerLayer?.parentElement).toHaveStyle(
      '--mobile-map-header-offset: 0px',
    );
    expect(scrollToSpy).not.toHaveBeenCalled();

    await user.click(mapBackground);

    expect(headerLayer).toHaveAttribute('data-state', 'open');
    expect(scrollToSpy).not.toHaveBeenCalled();

    scrollToSpy.mockRestore();
  });
});
