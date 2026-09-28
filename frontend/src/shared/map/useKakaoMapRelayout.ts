import { useEffect } from 'react';
import type { RefObject } from 'react';

interface KakaoMapRelayoutOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  map: kakao.maps.Map | null;
}

export function useKakaoMapRelayout({
  containerRef,
  map,
}: KakaoMapRelayoutOptions) {
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !map) {
      return;
    }

    const activeMap = map;
    let animationFrameId: number | null = null;

    function relayoutMap() {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const center = activeMap.getCenter();

        activeMap.relayout();
        activeMap.setCenter(center);
        activeMap.setDraggable(true);
        animationFrameId = null;
      });
    }

    const resizeObserver = new ResizeObserver(relayoutMap);

    resizeObserver.observe(container);
    window.addEventListener('resize', relayoutMap);
    relayoutMap();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', relayoutMap);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [containerRef, map]);
}
