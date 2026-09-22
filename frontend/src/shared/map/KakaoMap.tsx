import { useEffect, useRef } from 'react';
import type { WheelEvent } from 'react';

import { CurrentLocationButton } from './CurrentLocationButton';
import {
  LoadingDot,
  LocationErrorMessage,
  MapCanvas,
  MapControls,
  MapFrame,
  RetryButton,
  StatusContent,
  StatusLayer,
  StatusMessage,
} from './KakaoMap.styles';
import type { MapCoordinate } from './mapCoordinateType';
import { MapZoomControls } from './MapZoomControls';
import { useCurrentLocation } from './useCurrentLocation';
import { useCurrentLocationMarker } from './useCurrentLocationMarker';
import { useKakaoMap } from './useKakaoMap';
import { useKakaoMapInteractions } from './useKakaoMapInteractions';
import { useKakaoMapRelayout } from './useKakaoMapRelayout';
import { useKakaoMapViewport } from './useKakaoMapViewport';

export interface KakaoMapProps {
  center: MapCoordinate;
  level?: number;
  label?: string;
  onBackgroundClick?: () => void;
  onDragEnd?: () => void;
  onMapReady?: (map: kakao.maps.Map | null) => void;
  onViewportCenterChange?: (center: MapCoordinate) => void;
}

const DEFAULT_MAP_LEVEL = 4;
const MINIMUM_MAP_LEVEL = 1;
const MAXIMUM_MAP_LEVEL = 14;
const ZOOM_ANIMATION_DURATION_MS = 180;

function keepPageScrollAvailable(event: WheelEvent<HTMLElement>) {
  event.stopPropagation();
}

function changeMapLevel(map: kakao.maps.Map, levelDelta: number) {
  const nextLevel = Math.min(
    MAXIMUM_MAP_LEVEL,
    Math.max(MINIMUM_MAP_LEVEL, map.getLevel() + levelDelta),
  );

  map.setLevel(nextLevel, {
    animate: { duration: ZOOM_ANIMATION_DURATION_MS },
  });
}

export function KakaoMap({
  center,
  level = DEFAULT_MAP_LEVEL,
  label = '가챠 매장 지도',
  onBackgroundClick,
  onDragEnd,
  onMapReady,
  onViewportCenterChange,
}: KakaoMapProps) {
  const { containerRef, mapState, retryMap } = useKakaoMap({ center, level });
  const { locationState, requestCurrentLocation } = useCurrentLocation();
  const onMapReadyRef = useRef(onMapReady);
  const map = mapState.status === 'success' ? mapState.data : null;
  const currentLocation =
    locationState.status === 'success' ? locationState.data : null;

  useCurrentLocationMarker({ coordinate: currentLocation, map });
  useKakaoMapViewport({ map, onCenterChange: onViewportCenterChange });
  useKakaoMapInteractions({ map, onBackgroundClick, onDragEnd });
  useKakaoMapRelayout({ containerRef, map });

  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    if (mapState.status !== 'success') {
      return;
    }

    onMapReadyRef.current?.(mapState.data);

    return () => {
      onMapReadyRef.current?.(null);
    };
  }, [mapState]);

  useEffect(() => {
    if (
      mapState.status !== 'success' ||
      locationState.status !== 'success' ||
      !window.kakao?.maps
    ) {
      return;
    }

    mapState.data.panTo(
      new window.kakao.maps.LatLng(
        locationState.data.latitude,
        locationState.data.longitude,
      ),
    );
  }, [locationState, mapState]);

  return (
    <MapFrame
      role="region"
      aria-label={label}
      aria-busy={mapState.status === 'loading'}
      onWheelCapture={keepPageScrollAvailable}
    >
      <MapCanvas ref={containerRef} />

      {mapState.status === 'success' && (
        <MapControls>
          {locationState.status === 'error' && (
            <LocationErrorMessage role="alert">
              {locationState.errorMessage}
            </LocationErrorMessage>
          )}
          <MapZoomControls
            onZoomIn={() => changeMapLevel(mapState.data, -1)}
            onZoomOut={() => changeMapLevel(mapState.data, 1)}
          />
          <CurrentLocationButton
            isLocating={locationState.status === 'loading'}
            onLocate={requestCurrentLocation}
          />
        </MapControls>
      )}

      {mapState.status === 'loading' && (
        <StatusLayer role="status">
          <StatusContent>
            <LoadingDot aria-hidden="true" />
            <StatusMessage>지도를 불러오고 있어요.</StatusMessage>
          </StatusContent>
        </StatusLayer>
      )}

      {mapState.status === 'error' && (
        <StatusLayer role="alert">
          <StatusContent>
            <StatusMessage>{mapState.errorMessage}</StatusMessage>
            <RetryButton type="button" onClick={retryMap}>
              다시 시도
            </RetryButton>
          </StatusContent>
        </StatusLayer>
      )}
    </MapFrame>
  );
}
