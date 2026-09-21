import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { loadKakaoMapsSdk } from './loadKakaoMapsSdk';
import type { MapCoordinate } from './mapCoordinateType';

interface KakaoMapOptions {
  center: MapCoordinate;
  level: number;
}

export interface UseKakaoMapResult {
  containerRef: RefObject<HTMLDivElement | null>;
  mapState: AsyncState<kakao.maps.Map>;
  retryMap: () => void;
}

const DEFAULT_ERROR_MESSAGE = '지도를 불러오지 못했습니다.';
const LOADING_STATE: AsyncState<kakao.maps.Map> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

export function useKakaoMap({
  center,
  level,
}: KakaoMapOptions): UseKakaoMapResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const latestOptionsRef = useRef({ center, level });
  const [attempt, setAttempt] = useState(0);
  const [mapState, setMapState] =
    useState<AsyncState<kakao.maps.Map>>(LOADING_STATE);

  latestOptionsRef.current = { center, level };

  const retryMap = useCallback(() => {
    setMapState(LOADING_STATE);
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let isActive = true;

    async function initializeMap(mapContainer: HTMLDivElement) {
      try {
        await loadKakaoMapsSdk();

        if (!isActive || !window.kakao?.maps) {
          return;
        }

        const { center: initialCenter, level: initialLevel } =
          latestOptionsRef.current;
        const map = new window.kakao.maps.Map(mapContainer, {
          center: new window.kakao.maps.LatLng(
            initialCenter.latitude,
            initialCenter.longitude,
          ),
          level: initialLevel,
        });

        setMapState({ status: 'success', data: map, errorMessage: null });
      } catch (error: unknown) {
        if (isActive) {
          setMapState({
            status: 'error',
            data: null,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    }

    void initializeMap(container);

    return () => {
      isActive = false;
      container.replaceChildren();
    };
  }, [attempt]);

  useEffect(() => {
    if (mapState.status !== 'success' || !window.kakao?.maps) {
      return;
    }

    mapState.data.panTo(
      new window.kakao.maps.LatLng(center.latitude, center.longitude),
    );
  }, [center.latitude, center.longitude, mapState]);

  useEffect(() => {
    if (mapState.status !== 'success') {
      return;
    }

    mapState.data.setLevel(level);
  }, [level, mapState]);

  return { containerRef, mapState, retryMap };
}
