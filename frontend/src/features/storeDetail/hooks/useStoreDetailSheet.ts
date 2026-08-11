import { useCallback, useState } from 'react';

import type { BottomSheetState } from '../model/storeDetail';

export interface StorePinSelection {
  storeId: number;
  distanceMeters?: number;
}

export function useStoreDetailSheet() {
  const [selection, setSelection] = useState<StorePinSelection | null>(null);
  const [state, setState] = useState<BottomSheetState>('closed');

  const openStoreDetail = useCallback((nextSelection: StorePinSelection) => {
    setSelection(nextSelection);
    setState('closed');
    requestAnimationFrame(() => setState('full'));
  }, []);

  const closeStoreDetail = useCallback(() => {
    setState('closed');
  }, []);

  return {
    closeStoreDetail,
    openStoreDetail,
    selection,
    setState,
    state,
  };
}
