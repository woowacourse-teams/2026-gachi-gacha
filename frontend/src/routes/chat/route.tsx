import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import { AppHeader } from '@/shared/ui/AppHeader';
import { UnderConstructionPage } from '@/shared/ui/UnderConstructionPage';

function openGachaSearchResults(gachaId: number) {
  window.location.assign(createGachaSearchResultsUrl(gachaId));
}

export function ChatRoute() {
  return (
    <UnderConstructionPage
      header={
        <AppHeader
          currentPath="/chat"
          search={<GachaSearchBar onSelect={openGachaSearchResults} />}
        />
      }
      title="채팅 페이지를 준비하고 있어요"
      description="안전하게 교환 대화를 이어갈 수 있는 채팅 기능을 곧 선보일게요."
    />
  );
}
