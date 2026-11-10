import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { KakaoMap } from './KakaoMap';

const mockMap = { panTo: jest.fn() };
const mockRetryLocation = jest.fn();
const mockLocationState = {
  status: 'error',
  data: null,
  errorMessage: '현재 위치를 확인하려면 위치 권한을 허용해 주세요.',
};

jest.mock('./useKakaoMap', () => ({
  useKakaoMap: () => ({
    containerRef: { current: null },
    mapState: { status: 'success', data: mockMap, errorMessage: null },
    retryMap: jest.fn(),
  }),
}));
jest.mock('./useCurrentLocation', () => ({
  useCurrentLocation: () => ({
    locationState: mockLocationState,
    requestCurrentLocation: mockRetryLocation,
  }),
}));
jest.mock('./useCurrentLocationMarker', () => ({
  useCurrentLocationMarker: jest.fn(),
}));
jest.mock('./useKakaoMapInteractions', () => ({
  useKakaoMapInteractions: jest.fn(),
}));
jest.mock('./useKakaoMapRelayout', () => ({ useKakaoMapRelayout: jest.fn() }));
jest.mock('./useKakaoMapViewport', () => ({ useKakaoMapViewport: jest.fn() }));

describe('지도 위치 오류 안내', () => {
  it('위치 권한을 거부해도 안내를 닫고 기존 지도를 계속 사용할 수 있다', async () => {
    const user = userEvent.setup();
    render(
      <KakaoMap
        center={{ latitude: 37.5563, longitude: 126.9236 }}
        locationErrorAsDialog
      />,
    );

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      '위치 권한을 허용해 주세요.',
    );
    await user.click(screen.getByRole('button', { name: '지도 계속 보기' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: '가챠 매장 지도' }),
    ).toBeInTheDocument();
    expect(mockRetryLocation).not.toHaveBeenCalled();
  });
});
