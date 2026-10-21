import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import type { MapCoordinate } from './storeTypes';

type LocationState = {
  status: 'idle' | 'requesting' | 'success' | 'error';
  errorMessage: string | null;
};

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ status: 'idle', errorMessage: null });
  const mountedRef = useRef(true);
  const requestingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function requestCurrentLocation(): Promise<MapCoordinate | null> {
    if (requestingRef.current) return null;

    requestingRef.current = true;
    setState({ status: 'requesting', errorMessage: null });

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        if (mountedRef.current) {
          setState({
            status: 'error',
            errorMessage: permission.canAskAgain
              ? '내 주변 매장을 찾으려면 위치 권한을 허용해 주세요.'
              : '위치 권한이 꺼져 있어요. 기기 설정에서 가치가챠의 위치 권한을 허용해 주세요.',
          });
        }
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      if (!mountedRef.current) return null;
      setState({ status: 'success', errorMessage: null });
      return coordinate;
    } catch {
      if (mountedRef.current) {
        setState({
          status: 'error',
          errorMessage: '현재 위치를 확인하지 못했어요. 위치 서비스를 켠 뒤 다시 시도해 주세요.',
        });
      }
      return null;
    } finally {
      requestingRef.current = false;
    }
  }

  function reset() {
    setState({ status: 'idle', errorMessage: null });
  }

  return {
    ...state,
    requestCurrentLocation,
    reset,
  };
}
