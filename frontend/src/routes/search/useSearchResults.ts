import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { getSelectedGachaId } from './searchParams';
import { useSelectedGacha } from './useSelectedGacha';

export interface SearchResultsState {
  selectedGachaId: number | null;
  selectedGacha: AsyncState<GachaProductSummary>;
}

export function useSearchResults(search: string): SearchResultsState {
  const selectedGachaId = getSelectedGachaId(search);
  const selectedGacha = useSelectedGacha(selectedGachaId);

  return { selectedGachaId, selectedGacha };
}
