import { useEffect, useRef } from 'react';

import type { MapCoordinate } from './mapCoordinateType';

interface KakaoMapViewportOptions {
  map: kakao.maps.Map | null;
  onCenterChange: ((center: MapCoordinate) => void) | undefined;
}

export function useKakaoMapViewport({
  map,
  onCenterChange,
}: KakaoMapViewportOptions) {
  const onCenterChangeRef = useRef(onCenterChange);

  onCenterChangeRef.current = onCenterChange;

  useEffect(() => {
    if (!map || !window.kakao?.maps) {
      return;
    }

    const { maps } = window.kakao;
    const handleMapIdle = () => {
      const center = map.getCenter();

      onCenterChangeRef.current?.({
        latitude: center.getLat(),
        longitude: center.getLng(),
      });
    };

    maps.event.addListener(map, 'idle', handleMapIdle);

    return () => {
      maps.event.removeListener(map, 'idle', handleMapIdle);
    };
  }, [map]);
}
