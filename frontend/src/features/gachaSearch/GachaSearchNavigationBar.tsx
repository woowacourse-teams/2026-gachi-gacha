import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';

import { GachaSearchBar } from './GachaSearchBar';

function openGachaSearchResults(gachaId: number) {
  window.location.assign(createGachaSearchResultsUrl(gachaId));
}

export function GachaSearchNavigationBar() {
  return <GachaSearchBar onSelect={openGachaSearchResults} />;
}
