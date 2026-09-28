import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import { AppHeader } from '@/shared/ui/AppHeader';
import { UnderConstructionPage } from '@/shared/ui/UnderConstructionPage';

function openGachaSearchResults(gachaId: number) {
  window.location.assign(createGachaSearchResultsUrl(gachaId));
}

export function NotificationsRoute() {
  return (
    <UnderConstructionPage
      header={
        <AppHeader
          currentPath="/notifications"
          search={<GachaSearchBar onSelect={openGachaSearchResults} />}
        />
      }
      title="알림 페이지를 준비하고 있어요"
      description="채팅과 관심 가챠 소식을 놓치지 않도록 알림 기능을 준비하고 있어요."
    />
  );
}
