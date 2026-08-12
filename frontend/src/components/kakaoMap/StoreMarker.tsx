import { useEffect, useRef } from 'react';

import markerSprite from '@/assets/marker-sprite.png';
import markerSprite2x from '@/assets/marker-sprite@2x.png';
import markerSprite3x from '@/assets/marker-sprite@3x.png';

import { useMap } from './KakaoMapContext';
import type { LatLngLiteral } from './useKakaoMap';

const SPRITE_WIDTH = 86;
const SPRITE_HEIGHT = 57;

const MARKER_VARIANT = {
  default: { originX: 0, originY: 0, width: 40, height: 47 },
  selected: { originX: 40, originY: 0, width: 46, height: 57 },
} as const;

const MARKER_Z_INDEX = {
  default: 1,
  selected: 10,
} as const;

function resolveSpriteSrc() {
  if (window.devicePixelRatio >= 3) return markerSprite3x;
  if (window.devicePixelRatio >= 2) return markerSprite2x;

  return markerSprite;
}

function createMarkerImage(isSelected: boolean) {
  const { maps } = window.kakao;
  const variant = isSelected ? MARKER_VARIANT.selected : MARKER_VARIANT.default;

  return new maps.MarkerImage(
    resolveSpriteSrc(),
    new maps.Size(variant.width, variant.height),
    {
      spriteSize: new maps.Size(SPRITE_WIDTH, SPRITE_HEIGHT),
      spriteOrigin: new maps.Point(variant.originX, variant.originY),
      offset: new maps.Point(variant.width / 2, variant.height),
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
