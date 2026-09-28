import { useCallback, useEffect, useRef, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import type { MapCoordinate } from './mapCoordinateType';

export interface UseCurrentLocationResult {
  locationState: AsyncState<MapCoordinate>;
  requestCurrentLocation: () => void;
}

const IDLE_STATE: AsyncState<MapCoordinate> = {
  status: 'idle',
  data: null,
  errorMessage: null,
};

const LOADING_STATE: AsyncState<MapCoordinate> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 60_000,
  timeout: 10_000,
};

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return '현재 위치를 확인하려면 위치 권한을 허용해 주세요.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return '현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }

  if (error.code === error.TIMEOUT) {
    return '현재 위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.';
  }

  return '현재 위치를 불러오지 못했습니다.';
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [locationState, setLocationState] =
    useState<AsyncState<MapCoordinate>>(IDLE_STATE);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState({
        status: 'error',
        data: null,
        errorMessage: '이 브라우저에서는 현재 위치 기능을 지원하지 않습니다.',
      });
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLocationState(LOADING_STATE);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setLocationState({
          status: 'success',
          data: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          errorMessage: null,
        });
      },
      (error) => {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setLocationState({
          status: 'error',
          data: null,
          errorMessage: getGeolocationErrorMessage(error),
        });
      },
      GEOLOCATION_OPTIONS,
    );
  }, []);

  return { locationState, requestCurrentLocation };
}
