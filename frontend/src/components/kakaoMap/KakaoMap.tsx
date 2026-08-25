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
  /** 지도의 빈 곳을 눌렀을 때. 마커를 누른 경우에는 호출되지 않는다. */
  onMapClick?: () => void;
  /** 사용자가 지도 드래그를 마쳤을 때. 프로그램으로 지도를 옮긴 경우에는 호출되지 않는다. */
  onMapDragEnd?: () => void;
  children?: ReactNode;
}

export default function KakaoMap({
  defaultCenter,
  defaultLevel = 4,
  onMapReady,
  onMapClick,
  onMapDragEnd,
  children,
}: KakaoMapProps) {
  const kakaoMap = useKakaoMap({ defaultCenter, defaultLevel });
  const map = kakaoMap.status === 'success' ? kakaoMap.data : null;
  const onMapReadyRef = useRef(onMapReady);
  const onMapClickRef = useRef(onMapClick);
  const onMapDragEndRef = useRef(onMapDragEnd);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
    onMapClickRef.current = onMapClick;
    onMapDragEndRef.current = onMapDragEnd;
  });

  useEffect(() => {
    if (!map) return;

    onMapReadyRef.current?.(map);
  }, [map]);

  // 핸들러를 ref로 읽으므로 지도가 새로 만들어질 때만 리스너를 다시 건다.
  useEffect(() => {
    if (!map) return;

    const { maps } = window.kakao;
    const handleClick = () => onMapClickRef.current?.();
    const handleDragEnd = () => onMapDragEndRef.current?.();

    maps.event.addListener(map, 'click', handleClick);
    maps.event.addListener(map, 'dragend', handleDragEnd);

    return () => {
      maps.event.removeListener(map, 'click', handleClick);
      maps.event.removeListener(map, 'dragend', handleDragEnd);
    };
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
