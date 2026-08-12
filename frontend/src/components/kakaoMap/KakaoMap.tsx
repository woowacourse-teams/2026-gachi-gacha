import { useEffect, useRef, type ReactNode } from 'react';
import styled from '@emotion/styled';

import ErrorNotice from '@/components/ErrorNotice';

import { KakaoMapContext } from './KakaoMapContext';
import { useKakaoMap, type LatLngLiteral } from './useKakaoMap';

const MAP_ERROR_MESSAGE = '지도를 불러오지 못했습니다.';

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
  const kakaoMap = useKakaoMap({ defaultCenter, defaultLevel });
  const map = kakaoMap.status === 'success' ? kakaoMap.data : null;
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
      <MapCanvas ref={kakaoMap.containerRef} />

      {kakaoMap.status === 'error' && (
        <MapErrorNotice message={MAP_ERROR_MESSAGE} onRetry={kakaoMap.retry} />
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

const MapErrorNotice = styled(ErrorNotice)`
  position: absolute;
  inset: 0;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
  background-color: #f4f4f5;
  color: #52525b;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
`;
