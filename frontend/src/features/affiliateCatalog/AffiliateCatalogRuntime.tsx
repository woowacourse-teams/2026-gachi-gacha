import { AffiliateCatalogPlacement } from './AffiliateCatalogPlacement';
import { AffiliateCatalogSection } from './AffiliateCatalogSection';
import type { AffiliateCatalogSlotProps } from './AffiliateCatalogSlot';

export function AffiliateCatalogRuntime(props: AffiliateCatalogSlotProps) {
  if (props.matchBy === 'category') {
    return (
      <AffiliateCatalogSection
        categoryName={props.categoryName}
        placementPath={props.placementPath}
      />
    );
  }

  return (
    <AffiliateCatalogPlacement
      categoryNames={props.categoryNames}
      placementPath={props.placementPath}
      {...(props.title === undefined ? {} : { title: props.title })}
    />
  );
}
