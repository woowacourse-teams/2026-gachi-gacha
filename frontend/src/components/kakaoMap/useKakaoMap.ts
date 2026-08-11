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
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!window.kakao?.maps) {
      throw new Error(
        '카카오 지도 SDK를 불러오지 못했습니다. 앱 키와 등록된 웹 도메인을 확인하세요.',
      );
    }

    let cancelled = false;

    window.kakao.maps.load(() => {
      if (cancelled) return;

      const nextMap = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });

      mapRef.current = nextMap;
      setMap(nextMap);
    });

    return () => {
      cancelled = true;
      mapRef.current = null;
      container.innerHTML = '';
    };
  }, [center.lat, center.lng, level]);

  return { containerRef, map, mapRef };
}
