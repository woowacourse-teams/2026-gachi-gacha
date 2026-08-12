import { useCallback, useEffect, useRef, useState } from 'react';

import type { AsyncState } from '@/types/asyncState';

import { loadKakaoSdk } from './loadKakaoSdk';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export type KakaoMapState = AsyncState<kakao.maps.Map>;

interface UseKakaoMapParams {
  defaultCenter: LatLngLiteral;
  defaultLevel: number;
}

const LOADING_STATE: KakaoMapState = { status: 'loading' };

export function useKakaoMap({
  defaultCenter,
  defaultLevel,
}: UseKakaoMapParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialViewRef = useRef({ center: defaultCenter, level: defaultLevel });
  const [state, setState] = useState<KakaoMapState>(LOADING_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    setState(LOADING_STATE);

    loadKakaoSdk()
      .then(() => {
        if (cancelled) return;

        const { center, level } = initialViewRef.current;

        setState({
          status: 'success',
          data: new window.kakao.maps.Map(container, {
            center: new window.kakao.maps.LatLng(center.lat, center.lng),
            level,
          }),
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;

        setState({
          status: 'error',
          error:
            cause instanceof Error ? cause : new Error('kakao-map/unknown'),
        });
      });

    return () => {
      cancelled = true;
      container.innerHTML = '';
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { containerRef, retry, ...state };
}
