import { useEffect, useRef } from 'react';

import { useMap } from './KakaoMapContext';
import { MARKER_ICON } from './markerIcon';
import type { LatLngLiteral } from './useKakaoMap';

const MARKER_Z_INDEX = {
  default: 1,
  selected: 10,
} as const;

function createMarkerImage(isSelected: boolean) {
  const { maps } = window.kakao;
  const icon = isSelected ? MARKER_ICON.selected : MARKER_ICON.default;

  return new maps.MarkerImage(
    icon.src,
    new maps.Size(icon.width, icon.height),
    {
      offset: new maps.Point(icon.anchorX, icon.anchorY),
      shape: icon.hitShape,
      coords: icon.hitCoords,
    },
  );
}

function resolveZIndex(isSelected: boolean) {
  return isSelected ? MARKER_Z_INDEX.selected : MARKER_Z_INDEX.default;
}

interface StoreMarkerProps {
  position: LatLngLiteral;
  isSelected?: boolean;
  onClick: () => void;
}

export default function StoreMarker({
  position,
  isSelected = false,
  onClick,
}: StoreMarkerProps) {
  const map = useMap();
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const onClickRef = useRef(onClick);
  const isSelectedRef = useRef(isSelected);

  useEffect(() => {
    onClickRef.current = onClick;
    isSelectedRef.current = isSelected;
  });

  useEffect(() => {
    const { maps } = window.kakao;
    const selected = isSelectedRef.current;

    const marker = new maps.Marker({
      map,
      position: new maps.LatLng(position.lat, position.lng),
      image: createMarkerImage(selected),
      zIndex: resolveZIndex(selected),
      clickable: true,
    });

    const handleClick = () => onClickRef.current();

    maps.event.addListener(marker, 'click', handleClick);
    markerRef.current = marker;

    return () => {
      maps.event.removeListener(marker, 'click', handleClick);
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [map, position.lat, position.lng]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    marker.setImage(createMarkerImage(isSelected));
    marker.setZIndex(resolveZIndex(isSelected));
  }, [isSelected]);

  return null;
}
