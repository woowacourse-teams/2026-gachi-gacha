import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { AppHeader } from '@/shared/ui/AppHeader';

import { GachaSearchBar } from './GachaSearchBar';

interface AppGachaSearchHeaderProps {
  currentPath: string;
}

function openGachaSearchResults(gachaId: number) {
  window.location.assign(createGachaSearchResultsUrl(gachaId));
}

export function AppGachaSearchHeader({
  currentPath,
}: AppGachaSearchHeaderProps) {
  return (
    <AppHeader
      currentPath={currentPath}
      search={<GachaSearchBar onSelect={openGachaSearchResults} />}
    />
  );
}
