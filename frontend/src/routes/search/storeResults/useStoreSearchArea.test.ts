import { describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

import { useStoreSearchArea } from './useStoreSearchArea';

const HONGDAE_CENTER = {
  latitude: 37.5563,
  longitude: 126.9236,
} satisfies MapCoordinate;

const MOVED_CENTER = {
  latitude: 37.503,
  longitude: 127.025,
} satisfies MapCoordinate;

describe('useStoreSearchArea', () => {
  it('지도만 이동하면 검색 영역이 변경되었다고 표시한다', () => {
    const { result } = renderHook(() => useStoreSearchArea(HONGDAE_CENTER));

    act(() => result.current.updateViewportCenter(MOVED_CENTER));

    expect(result.current.searchCenter).toEqual(HONGDAE_CENTER);
    expect(result.current.isSearchAreaChanged).toBe(true);
  });

  it('현재 지도 영역을 확정하면 해당 좌표를 검색 기준으로 사용한다', () => {
    const { result } = renderHook(() => useStoreSearchArea(HONGDAE_CENTER));

    act(() => result.current.updateViewportCenter(MOVED_CENTER));
    act(() => result.current.commitViewportCenter());

    expect(result.current.searchCenter).toEqual(MOVED_CENTER);
    expect(result.current.isSearchAreaChanged).toBe(false);
  });

  it('가챠를 새로 선택하면 검색 영역과 지도 화면을 서비스 지역으로 복원한다', () => {
    const { result } = renderHook(() => useStoreSearchArea(HONGDAE_CENTER));

    act(() => result.current.updateViewportCenter(MOVED_CENTER));
    act(() => result.current.commitViewportCenter());
    act(() => result.current.resetSearchArea(HONGDAE_CENTER));

    expect(result.current.searchCenter).toEqual(HONGDAE_CENTER);
    expect(result.current.isSearchAreaChanged).toBe(false);
  });
});
