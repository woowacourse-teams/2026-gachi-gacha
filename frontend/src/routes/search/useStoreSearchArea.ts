import { useCallback, useState } from 'react';

import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

export interface UseStoreSearchAreaResult {
  searchCenter: MapCoordinate;
  isSearchAreaChanged: boolean;
  updateViewportCenter: (center: MapCoordinate) => void;
  commitViewportCenter: () => void;
}

const COORDINATE_EPSILON = 0.00001;

function isSameCoordinate(
  first: MapCoordinate,
  second: MapCoordinate,
): boolean {
  return (
    Math.abs(first.latitude - second.latitude) < COORDINATE_EPSILON &&
    Math.abs(first.longitude - second.longitude) < COORDINATE_EPSILON
  );
}

export function useStoreSearchArea(
  initialCenter: MapCoordinate,
): UseStoreSearchAreaResult {
  const [searchCenter, setSearchCenter] = useState(initialCenter);
  const [viewportCenter, setViewportCenter] = useState(initialCenter);
  const isSearchAreaChanged = !isSameCoordinate(searchCenter, viewportCenter);

  const updateViewportCenter = useCallback((center: MapCoordinate) => {
    setViewportCenter((currentCenter) =>
      isSameCoordinate(currentCenter, center) ? currentCenter : center,
    );
  }, []);

  const commitViewportCenter = useCallback(() => {
    setSearchCenter(viewportCenter);
  }, [viewportCenter]);

  return {
    searchCenter,
    isSearchAreaChanged,
    updateViewportCenter,
    commitViewportCenter,
  };
}
