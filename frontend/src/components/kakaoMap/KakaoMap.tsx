import type { ReactNode } from 'react';
import styled from '@emotion/styled';

import { useKakaoMap, type LatLngLiteral } from './useKakaoMap';

interface KakaoMapProps {
  center: LatLngLiteral;
  level?: number;
  children?: ReactNode;
}

export default function KakaoMap({
  center,
  level = 4,
  children,
}: KakaoMapProps) {
  const { containerRef } = useKakaoMap({ center, level });

  return (
    <MapArea>
      <MapCanvas ref={containerRef} />
      {children}
    </MapArea>
  );
}

const MapArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const MapCanvas = styled.div`
  width: 100%;
  height: 100%;
`;
