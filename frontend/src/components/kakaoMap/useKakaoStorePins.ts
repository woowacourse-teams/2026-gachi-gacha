import { useEffect, useState } from 'react';

import type { StoreMapPin } from './storePin';

export interface StorePinOverlay {
  container: HTMLDivElement;
  pin: StoreMapPin;
}

export function useKakaoStorePins(
  map: kakao.maps.Map | null,
  pins: StoreMapPin[],
) {
  const [pinOverlays, setPinOverlays] = useState<StorePinOverlay[]>([]);

  useEffect(() => {
    if (!map) return;

    const overlays = pins.map((pin) => {
      const container = document.createElement('div');
      const overlay = new window.kakao.maps.CustomOverlay({
        clickable: true,
        content: container,
        position: new window.kakao.maps.LatLng(pin.latitude, pin.longitude),
        xAnchor: 0.5,
        yAnchor: 1.15,
        zIndex: 3,
      });

      overlay.setMap(map);

      return { container, overlay, pin };
    });

    setPinOverlays(overlays.map(({ container, pin }) => ({ container, pin })));

    return () => {
      overlays.forEach(({ overlay }) => overlay.setMap(null));
    };
  }, [map, pins]);

  return pinOverlays;
}
