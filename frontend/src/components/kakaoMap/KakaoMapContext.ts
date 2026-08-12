import { createContext, useContext } from 'react';

export const KakaoMapContext = createContext<kakao.maps.Map | null>(null);

export function useMap() {
  const map = useContext(KakaoMapContext);

  if (!map) {
    throw new Error('useMap은 KakaoMap 컴포넌트 안에서만 사용할 수 있습니다.');
  }

  return map;
}
