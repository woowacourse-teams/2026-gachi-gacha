import styled from '@emotion/styled';

import { useKakaoMap, type LatLngLiteral } from './useKakaoMap';

interface KakaoMapProps {
  center: LatLngLiteral;
  level?: number;
}

export default function KakaoMap({ center, level = 4 }: KakaoMapProps) {
  const { containerRef } = useKakaoMap({ center, level });

  return <MapContainer ref={containerRef} />;
}

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
`;
