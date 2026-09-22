import { useEffect, useRef } from 'react';
import type { PointerEvent, RefObject } from 'react';

interface KakaoMapInteractionsOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  map: kakao.maps.Map | null;
  onBackgroundClick: (() => void) | undefined;
  onDownwardDrag: (() => void) | undefined;
}

export interface KakaoMapInteractionHandlers {
  handlePointerCancel: () => void;
  handlePointerDown: (event: PointerEvent<HTMLElement>) => void;
  handlePointerUp: (event: PointerEvent<HTMLElement>) => void;
}

interface PointerOrigin {
  pointerId: number;
  x: number;
  y: number;
}

const DOWNWARD_DRAG_THRESHOLD_PX = 72;

export function useKakaoMapInteractions({
  containerRef,
  map,
  onBackgroundClick,
  onDownwardDrag,
}: KakaoMapInteractionsOptions): KakaoMapInteractionHandlers {
  const pointerOriginRef = useRef<PointerOrigin | null>(null);
  const onBackgroundClickRef = useRef(onBackgroundClick);

  onBackgroundClickRef.current = onBackgroundClick;

  useEffect(() => {
    if (!map || !window.kakao?.maps) {
      return;
    }

    const { maps } = window.kakao;
    const handleBackgroundClick = () => onBackgroundClickRef.current?.();

    maps.event.addListener(map, 'click', handleBackgroundClick);

    return () => {
      maps.event.removeListener(map, 'click', handleBackgroundClick);
    };
  }, [map]);

  function handlePointerCancel() {
    pointerOriginRef.current = null;
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (
      !event.isPrimary ||
      !(event.target instanceof Node) ||
      !containerRef.current?.contains(event.target)
    ) {
      return;
    }

    pointerOriginRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const origin = pointerOriginRef.current;

    pointerOriginRef.current = null;

    if (!origin || origin.pointerId !== event.pointerId) {
      return;
    }

    const horizontalDistance = Math.abs(event.clientX - origin.x);
    const downwardDistance = event.clientY - origin.y;

    if (
      downwardDistance >= DOWNWARD_DRAG_THRESHOLD_PX &&
      downwardDistance > horizontalDistance
    ) {
      onDownwardDrag?.();
    }
  }

  return { handlePointerCancel, handlePointerDown, handlePointerUp };
}
