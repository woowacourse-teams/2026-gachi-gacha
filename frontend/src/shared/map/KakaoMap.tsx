import { useEffect, useRef } from 'react';

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
import { useCurrentLocation } from './useCurrentLocation';
import { useKakaoMap } from './useKakaoMap';

export interface KakaoMapProps {
  center: MapCoordinate;
  level?: number;
  label?: string;
  onMapReady?: (map: kakao.maps.Map | null) => void;
}

const DEFAULT_MAP_LEVEL = 4;

export function KakaoMap({
  center,
  level = DEFAULT_MAP_LEVEL,
  label = '가챠 매장 지도',
  onMapReady,
}: KakaoMapProps) {
  const { containerRef, mapState, retryMap } = useKakaoMap({ center, level });
  const { locationState, requestCurrentLocation } = useCurrentLocation();
  const onMapReadyRef = useRef(onMapReady);

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
    >
      <MapCanvas ref={containerRef} />

      {mapState.status === 'success' && (
        <MapControls>
          {locationState.status === 'error' && (
            <LocationErrorMessage role="alert">
              {locationState.errorMessage}
            </LocationErrorMessage>
          )}
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
