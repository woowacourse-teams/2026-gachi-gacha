import { useEffect, useRef } from 'react';

import {
  STORE_MARKER_IMAGE,
  type StoreMarkerImage,
} from '@/shared/map/storeMarkerImage';

import type { NearbyStoreResponseDto } from '../api/nearbyStoresResponseType';

interface StoreMarkersOptions {
  map: kakao.maps.Map | null;
  stores: readonly NearbyStoreResponseDto[];
  selectedStoreId: number | null;
  onSelectStore: (storeId: number) => void;
}

interface StoreMarkerEntry {
  marker: kakao.maps.Marker;
  handleClick: () => void;
}

interface StoreMarkerImages {
  default: kakao.maps.MarkerImage;
  selected: kakao.maps.MarkerImage;
}

const MARKER_Z_INDEX = {
  default: 1,
  selected: 10,
} as const;

function createKakaoMarkerImage(
  markerImage: StoreMarkerImage,
): kakao.maps.MarkerImage {
  const { maps } = window.kakao;

  return new maps.MarkerImage(
    markerImage.src,
    new maps.Size(markerImage.width, markerImage.height),
    {
      offset: new maps.Point(markerImage.anchorX, markerImage.anchorY),
      shape: markerImage.hitShape,
      coords: markerImage.hitCoords,
    },
  );
}

function createStoreMarkerImages(): StoreMarkerImages {
  return {
    default: createKakaoMarkerImage(STORE_MARKER_IMAGE.default),
    selected: createKakaoMarkerImage(STORE_MARKER_IMAGE.selected),
  };
}

function removeStoreMarker(entry: StoreMarkerEntry) {
  window.kakao?.maps.event.removeListener(
    entry.marker,
    'click',
    entry.handleClick,
  );
  entry.marker.setMap(null);
}

function clearStoreMarkers(entries: Map<number, StoreMarkerEntry>) {
  entries.forEach(removeStoreMarker);
  entries.clear();
}

export function useStoreMarkers({
  map,
  stores,
  selectedStoreId,
  onSelectStore,
}: StoreMarkersOptions) {
  const markerEntriesRef = useRef(new Map<number, StoreMarkerEntry>());
  const markerImagesRef = useRef<StoreMarkerImages | null>(null);
  const onSelectStoreRef = useRef(onSelectStore);
  const selectedStoreIdRef = useRef(selectedStoreId);

  onSelectStoreRef.current = onSelectStore;
  selectedStoreIdRef.current = selectedStoreId;

  useEffect(() => {
    const markerEntries = markerEntriesRef.current;

    if (!map || !window.kakao?.maps) {
      clearStoreMarkers(markerEntries);
      markerImagesRef.current = null;
      return;
    }

    const { maps } = window.kakao;
    const markerImages = markerImagesRef.current ?? createStoreMarkerImages();
    const activeStoreIds = new Set(stores.map((store) => store.storeId));

    markerImagesRef.current = markerImages;

    markerEntries.forEach((entry, storeId) => {
      if (!activeStoreIds.has(storeId)) {
        removeStoreMarker(entry);
        markerEntries.delete(storeId);
      }
    });

    stores.forEach((store) => {
      const position = new maps.LatLng(store.latitude, store.longitude);
      const existingEntry = markerEntries.get(store.storeId);

      if (existingEntry) {
        existingEntry.marker.setMap(map);
        existingEntry.marker.setPosition(position);
        return;
      }

      const isSelected = store.storeId === selectedStoreIdRef.current;
      const marker = new maps.Marker({
        clickable: true,
        image: isSelected ? markerImages.selected : markerImages.default,
        map,
        position,
        title: store.name,
        zIndex: isSelected ? MARKER_Z_INDEX.selected : MARKER_Z_INDEX.default,
      });
      const handleClick = () => {
        maps.event.preventMap();
        onSelectStoreRef.current(store.storeId);
      };

      maps.event.addListener(marker, 'click', handleClick);
      markerEntries.set(store.storeId, { marker, handleClick });
    });
  }, [map, stores]);

  useEffect(() => {
    const markerImages = markerImagesRef.current;

    if (!markerImages) {
      return;
    }

    markerEntriesRef.current.forEach(({ marker }, storeId) => {
      const isSelected = storeId === selectedStoreId;

      marker.setImage(
        isSelected ? markerImages.selected : markerImages.default,
      );
      marker.setZIndex(
        isSelected ? MARKER_Z_INDEX.selected : MARKER_Z_INDEX.default,
      );
    });
  }, [selectedStoreId]);

  useEffect(
    () => () => {
      clearStoreMarkers(markerEntriesRef.current);
      markerImagesRef.current = null;
    },
    [],
  );
}
