import { createPortal } from 'react-dom';

import type { StorePinSelection } from '@/features/storeDetail';

import { MapContainer, StorePinButton } from './KakaoMap.styles';
import type { StoreMapPin } from './storePin';
import { useKakaoMap, type LatLngLiteral } from './useKakaoMap';
import { useKakaoStorePins } from './useKakaoStorePins';

const EMPTY_STORE_PINS: StoreMapPin[] = [];

interface KakaoMapProps {
  center: LatLngLiteral;
  level?: number;
  pins?: StoreMapPin[];
  onStorePinClick?: (selection: StorePinSelection) => void;
}

function toStorePinSelection(pin: StoreMapPin): StorePinSelection {
  return pin.distanceMeters === undefined
    ? { storeId: pin.storeId }
    : { storeId: pin.storeId, distanceMeters: pin.distanceMeters };
}

export default function KakaoMap({
  center,
  level = 4,
  pins = EMPTY_STORE_PINS,
  onStorePinClick,
}: KakaoMapProps) {
  const { containerRef, map } = useKakaoMap({ center, level });
  const pinOverlays = useKakaoStorePins(map, pins);

  return (
    <>
      <MapContainer ref={containerRef} />
      {pinOverlays.map(({ container, pin }) =>
        createPortal(
          <StorePinButton
            aria-label={`${pin.name} 상세 보기`}
            type="button"
            onClick={() => onStorePinClick?.(toStorePinSelection(pin))}
          >
            <span aria-hidden="true">★</span>
          </StorePinButton>,
          container,
          pin.storeId,
        ),
      )}
    </>
  );
}
