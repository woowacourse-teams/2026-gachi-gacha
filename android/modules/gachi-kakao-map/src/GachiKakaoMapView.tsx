import { requireNativeView } from 'expo';
import * as React from 'react';

import type { GachiKakaoMapViewProps } from './GachiKakaoMap.types';

let nativeView: React.ComponentType<GachiKakaoMapViewProps> | null = null;

function getNativeView(): React.ComponentType<GachiKakaoMapViewProps> {
  nativeView ??= requireNativeView<GachiKakaoMapViewProps>('GachiKakaoMap');
  return nativeView;
}

export default function GachiKakaoMapView(props: GachiKakaoMapViewProps) {
  const NativeView = getNativeView();

  return <NativeView {...props} />;
}
