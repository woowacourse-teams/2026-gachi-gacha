import { useEffect, useRef } from 'react';

import {
  CURRENT_LOCATION_MARKER_IMAGE_URL,
  CURRENT_LOCATION_MARKER_SIZE,
} from './currentLocationMarkerImage';
import type { MapCoordinate } from './mapCoordinateType';

interface CurrentLocationMarkerOptions {
  coordinate: MapCoordinate | null;
  map: kakao.maps.Map | null;
}

export function useCurrentLocationMarker({
  coordinate,
  map,
}: CurrentLocationMarkerOptions) {
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const markerMapRef = useRef<kakao.maps.Map | null>(null);

  useEffect(() => {
    if (!map || !window.kakao?.maps) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      markerMapRef.current = null;
      return;
    }

    if (!coordinate) {
      if (markerRef.current && markerMapRef.current !== map) {
        markerRef.current.setMap(map);
        markerMapRef.current = map;
      }
      return;
    }

    const position = new window.kakao.maps.LatLng(
      coordinate.latitude,
      coordinate.longitude,
    );

    if (!markerRef.current) {
      const imageSize = new window.kakao.maps.Size(
        CURRENT_LOCATION_MARKER_SIZE,
        CURRENT_LOCATION_MARKER_SIZE,
      );
      const imageOptions = {
        offset: new window.kakao.maps.Point(
          CURRENT_LOCATION_MARKER_SIZE / 2,
          CURRENT_LOCATION_MARKER_SIZE / 2,
        ),
      };
      const markerImage = new window.kakao.maps.MarkerImage(
        CURRENT_LOCATION_MARKER_IMAGE_URL,
        imageSize,
        imageOptions,
      );

      markerRef.current = new window.kakao.maps.Marker({
        image: markerImage,
        map,
        position,
        title: '현재 위치',
      });
      markerMapRef.current = map;
      return;
    }

    markerRef.current.setPosition(position);

    if (markerMapRef.current !== map) {
      markerRef.current.setMap(map);
      markerMapRef.current = map;
    }
  }, [coordinate, map]);

  useEffect(
    () => () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      markerMapRef.current = null;
    },
    [],
  );
}
