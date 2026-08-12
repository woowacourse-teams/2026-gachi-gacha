import { useEffect, useRef, useState } from 'react';

import { loadKakaoSdk } from './loadKakaoSdk';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export type KakaoMapStatus = 'loading' | 'ready' | 'error';

interface UseKakaoMapParams {
  defaultCenter: LatLngLiteral;
  defaultLevel: number;
}

function resolveStatus(
  map: kakao.maps.Map | null,
  error: Error | null,
): KakaoMapStatus {
  if (error) return 'error';
  if (map) return 'ready';

  return 'loading';
}

export function useKakaoMap({
  defaultCenter,
  defaultLevel,
}: UseKakaoMapParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialViewRef = useRef({ center: defaultCenter, level: defaultLevel });
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    loadKakaoSdk()
      .then(() => {
        if (cancelled) return;

        const { center, level } = initialViewRef.current;

        setMap(
          new window.kakao.maps.Map(container, {
            center: new window.kakao.maps.LatLng(center.lat, center.lng),
            level,
          }),
        );
      })
      .catch((cause: unknown) => {
        if (cancelled) return;

        setError(
          cause instanceof Error
            ? cause
            : new Error('지도를 불러오지 못했습니다.'),
        );
      });

    return () => {
      cancelled = true;
      setMap(null);
      container.innerHTML = '';
    };
  }, []);

  return { containerRef, map, error, status: resolveStatus(map, error) };
}
