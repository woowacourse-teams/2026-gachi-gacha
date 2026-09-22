import { useEffect, useRef } from 'react';

interface KakaoMapInteractionsOptions {
  map: kakao.maps.Map | null;
  onBackgroundClick: (() => void) | undefined;
  onDragEnd: (() => void) | undefined;
}

export function useKakaoMapInteractions({
  map,
  onBackgroundClick,
  onDragEnd,
}: KakaoMapInteractionsOptions) {
  const onBackgroundClickRef = useRef(onBackgroundClick);
  const onDragEndRef = useRef(onDragEnd);

  onBackgroundClickRef.current = onBackgroundClick;
  onDragEndRef.current = onDragEnd;

  useEffect(() => {
    if (!map || !window.kakao?.maps) {
      return;
    }

    const { maps } = window.kakao;
    const handleBackgroundClick = () => onBackgroundClickRef.current?.();
    const handleDragEnd = () => onDragEndRef.current?.();

    maps.event.addListener(map, 'click', handleBackgroundClick);
    maps.event.addListener(map, 'dragend', handleDragEnd);

    return () => {
      maps.event.removeListener(map, 'click', handleBackgroundClick);
      maps.event.removeListener(map, 'dragend', handleDragEnd);
    };
  }, [map]);
}
