import { useEffect, useRef, type ReactNode } from 'react';
import styled from '@emotion/styled';

import { KakaoMapContext } from './KakaoMapContext';
import { useKakaoMap, type LatLngLiteral } from './useKakaoMap';

interface KakaoMapProps {
  defaultCenter: LatLngLiteral;
  defaultLevel?: number;
  onMapReady?: (map: kakao.maps.Map) => void;
  children?: ReactNode;
}

export default function KakaoMap({
  defaultCenter,
  defaultLevel = 4,
  onMapReady,
  children,
}: KakaoMapProps) {
  const { containerRef, map, status, error } = useKakaoMap({
    defaultCenter,
    defaultLevel,
  });
  const onMapReadyRef = useRef(onMapReady);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  });

  useEffect(() => {
    if (!map) return;

    onMapReadyRef.current?.(map);
  }, [map]);

  return (
    <MapArea>
      <MapCanvas ref={containerRef} />

      {status === 'error' && (
        <MapFallback role="alert">
          {error?.message ?? '지도를 불러오지 못했습니다.'}
        </MapFallback>
      )}

      {map && (
        <KakaoMapContext.Provider value={map}>
          {children}
        </KakaoMapContext.Provider>
      )}
    </MapArea>
  );
}

const MapArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const MapCanvas = styled.div`
  width: 100%;
  height: 100%;
`;

const MapFallback = styled.p`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 24px;
  background-color: #f4f4f5;
  color: #52525b;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
`;
