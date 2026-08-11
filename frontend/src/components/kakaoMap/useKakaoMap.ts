import { useEffect, useRef, useState } from 'react';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface UseKakaoMapParams {
  center: LatLngLiteral;
  level: number;
}

export function useKakaoMap({ center, level }: UseKakaoMapParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialViewRef = useRef({ center, level });
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.kakao?.maps) return;

    const { center: initialCenter, level: initialLevel } =
      initialViewRef.current;

    let cancelled = false;

    window.kakao.maps.load(() => {
      if (cancelled) return;

      setMap(
        new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(
            initialCenter.lat,
            initialCenter.lng,
          ),
          level: initialLevel,
        }),
      );
    });

    return () => {
      cancelled = true;
      setMap(null);
      container.innerHTML = '';
    };
  }, []);

  return { containerRef, map };
}
