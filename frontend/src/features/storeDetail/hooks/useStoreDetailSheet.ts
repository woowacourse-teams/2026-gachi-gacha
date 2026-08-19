import { useCallback, useState } from 'react';

import type { BottomSheetState } from '../model/storeDetail';

export interface StorePinSelection {
  storeId: number;
  distanceMeters?: number;
}

/** 시트가 보이는 상태 중 가장 낮은 단계. 지도를 누르면 여기까지 내려간다. */
const FIRST_VISIBLE_STATE: BottomSheetState = 'collapsed';

export function useStoreDetailSheet() {
  const [selection, setSelection] = useState<StorePinSelection | null>(null);
  const [state, setState] = useState<BottomSheetState>('closed');

  /** 이 매장의 상세 시트가 지금 열려 있는지. 마커의 선택 표시도 이 값을 따른다. */
  const isStoreOpen = useCallback(
    (storeId: number) => state !== 'closed' && selection?.storeId === storeId,
    [selection, state],
  );

  const openStoreDetail = useCallback((nextSelection: StorePinSelection) => {
    setSelection(nextSelection);
    setState('closed');
    requestAnimationFrame(() => setState('summary'));
  }, []);

  const closeStoreDetail = useCallback(() => {
    setState('closed');
  }, []);

  /**
   * 지도의 빈 곳을 눌렀을 때. 시트를 첫 단계까지 내리고 매장 선택은 유지한다.
   *
   * 지도를 누르는 건 '지도를 보고 싶다'는 신호라, 어느 단계에 있든 한 번에
   * 가장 낮은 단계로 간다. 완전히 닫는 건 시트를 아래로 끌어 내리는 쪽에 맡긴다.
   */
  const collapseStoreDetail = useCallback(() => {
    setState((current) =>
      current === 'closed' ? current : FIRST_VISIBLE_STATE,
    );
  }, []);

  /**
   * 마커를 눌렀을 때. 이미 열려 있는 매장이면 아무것도 하지 않는다.
   *
   * 그냥 `openStoreDetail`을 다시 부르면 시트를 'closed'로 내렸다가 다음
   * 프레임에 'summary'로 올리기 때문에, 같은 곳을 눌렀는데 시트가 접혔다 펴지고
   * 상세 요청도 한 번 더 나간다.
   *
   * @returns 실제로 열었으면 true. 지도를 옮길지 판단하는 데 쓴다.
   */
  const selectStoreDetail = useCallback(
    (nextSelection: StorePinSelection) => {
      if (isStoreOpen(nextSelection.storeId)) return false;

      openStoreDetail(nextSelection);

      return true;
    },
    [isStoreOpen, openStoreDetail],
  );

  return {
    closeStoreDetail,
    collapseStoreDetail,
    isStoreOpen,
    openStoreDetail,
    selectStoreDetail,
    selection,
    setState,
    state,
  };
}
