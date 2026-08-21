import type { StoreDetail } from './storeDetail';

export function isGachaCatalogInterestEligible(
  store: Pick<StoreDetail, 'gachaImageUrls' | 'isGachaCatalogLoaded'>,
) {
  return store.isGachaCatalogLoaded && store.gachaImageUrls.length === 0;
}
