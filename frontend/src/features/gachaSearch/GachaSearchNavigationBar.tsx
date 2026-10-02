import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { assignBrowserLocation } from '@/shared/browser/browserNavigation';

import { GachaSearchBar } from './GachaSearchBar';

function openGachaSearchResults(gachaId: number) {
  assignBrowserLocation(createGachaSearchResultsUrl(gachaId));
}

export function GachaSearchNavigationBar() {
  return <GachaSearchBar onSelect={openGachaSearchResults} />;
}
