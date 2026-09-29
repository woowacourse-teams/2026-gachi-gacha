import type { GachaSearchProduct } from './gachaSearchResultType';

export function sortGachaSearchProductsByStoreCount(
  products: readonly GachaSearchProduct[],
): readonly GachaSearchProduct[] {
  return [...products].sort(
    (firstProduct, secondProduct) =>
      secondProduct.storeCount - firstProduct.storeCount,
  );
}
