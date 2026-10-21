import type { StyleProp, ViewStyle } from 'react-native';

export type KakaoMapCoordinate = {
  latitude: number;
  longitude: number;
};

export type KakaoMapMarker = KakaoMapCoordinate & {
  id: number;
};

export type MarkerPressEventPayload = {
  id: number;
};

export type MapErrorEventPayload = {
  message: string;
};

export type GachiKakaoMapViewProps = {
  active?: boolean;
  center: KakaoMapCoordinate;
  markers: KakaoMapMarker[];
  onMapError?: (event: { nativeEvent: MapErrorEventPayload }) => void;
  onMapReady?: () => void;
  onMarkerPress?: (event: { nativeEvent: MarkerPressEventPayload }) => void;
  showsUserLocation?: boolean;
  style?: StyleProp<ViewStyle>;
};
