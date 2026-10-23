import type { StyleProp, ViewStyle } from 'react-native';

export type KakaoMapCoordinate = {
  latitude: number;
  longitude: number;
};

export type KakaoMapMarker = KakaoMapCoordinate & {
  id: number;
  selected?: boolean;
};

export type MarkerPressEventPayload = {
  id: number;
};

export type MapErrorEventPayload = {
  message: string;
};

export type CameraMoveEndEventPayload = KakaoMapCoordinate;

export type GachiKakaoMapViewProps = {
  active?: boolean;
  center: KakaoMapCoordinate;
  markers: KakaoMapMarker[];
  onCameraMoveEnd?: (event: { nativeEvent: CameraMoveEndEventPayload }) => void;
  onMapError?: (event: { nativeEvent: MapErrorEventPayload }) => void;
  onMapReady?: () => void;
  onMarkerPress?: (event: { nativeEvent: MarkerPressEventPayload }) => void;
  recenterRequestId?: number;
  showsUserLocation?: boolean;
  style?: StyleProp<ViewStyle>;
};
