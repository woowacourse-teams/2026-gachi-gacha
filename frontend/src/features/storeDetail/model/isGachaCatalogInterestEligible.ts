import type { StoreDetail } from './storeDetail';

export function isGachaCatalogInterestEligible(
  store: Pick<
    StoreDetail,
    'gachaImageUrls' | 'isGachaCatalogLoaded' | 'socialLinks'
  >,
) {
  const hasInstagram = store.socialLinks.some(
    ({ platform }) => platform === 'instagram',
  );

  return (
    store.isGachaCatalogLoaded &&
    store.gachaImageUrls.length === 0 &&
    !hasInstagram
  );
}
