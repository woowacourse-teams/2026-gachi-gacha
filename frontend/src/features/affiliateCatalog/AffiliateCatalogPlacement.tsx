import { AffiliateCatalogSection } from './AffiliateCatalogSection';
import type { AffiliateCatalog } from './affiliateCatalogType';
import { findMatchingAffiliateCategory } from './findMatchingAffiliateCategory';
import { AFFILIATE_CATALOG } from './generatedCatalog';

interface AffiliateCatalogPlacementProps {
  categoryNames: readonly string[];
  placementPath: string;
  title?: string;
  catalog?: AffiliateCatalog;
}

export function AffiliateCatalogPlacement({
  categoryNames,
  placementPath,
  title,
  catalog = AFFILIATE_CATALOG,
}: AffiliateCatalogPlacementProps) {
  const categoryName = findMatchingAffiliateCategory({
    catalog,
    categoryNames,
    placementPath,
    ...(title === undefined ? {} : { title }),
  });

  if (!categoryName) {
    return null;
  }

  return (
    <AffiliateCatalogSection
      categoryName={categoryName}
      placementPath={placementPath}
      catalog={catalog}
    />
  );
}
