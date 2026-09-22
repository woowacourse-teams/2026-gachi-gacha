import type { AsyncState } from '@/shared/hooks/asyncStateType';

import type { NearbyStoresResponseDto } from './api/nearbyStoresResponseType';
import { StoreCard } from './StoreCard';
import {
  Count,
  DesktopTitle,
  Header,
  List,
  ListItem,
  LoadingCard,
  LoadingList,
  MobileTitle,
  Panel,
  RetryButton,
  StateArea,
  StateContent,
  StateMessage,
  Title,
} from './StoreListPanel.styles';
import { useStoreCarousel } from './useStoreCarousel';

export interface StoreListPanelProps {
  storesState: AsyncState<NearbyStoresResponseDto>;
  selectedStoreId: number | null;
  onOpenStore: (storeId: number) => void;
  onSelectStore: (storeId: number) => void;
  onRetry: () => void;
}

function StoreListLoading() {
  return (
    <LoadingList aria-label="매장 목록을 불러오는 중" aria-busy="true">
      <LoadingCard aria-hidden="true" />
      <LoadingCard aria-hidden="true" />
      <LoadingCard aria-hidden="true" />
    </LoadingList>
  );
}

export function StoreListPanel({
  storesState,
  selectedStoreId,
  onOpenStore,
  onSelectStore,
  onRetry,
}: StoreListPanelProps) {
  const storeCount =
    storesState.status === 'success' ? storesState.data.stores.length : null;
  const { listRef, handleScroll } = useStoreCarousel({
    selectedStoreId,
    onSelectStore,
  });

  return (
    <Panel aria-labelledby="search-store-list-title">
      <Header $showOnMobile={storeCount !== null}>
        <Title id="search-store-list-title">
          <DesktopTitle>가챠 보유 매장</DesktopTitle>
          <MobileTitle>검색 결과</MobileTitle>
        </Title>
        {storeCount !== null && <Count>{storeCount}곳</Count>}
      </Header>

      {storesState.status === 'idle' && (
        <StateArea>
          <StateMessage>가챠를 선택하면 보유 매장을 보여드려요.</StateMessage>
        </StateArea>
      )}

      {storesState.status === 'loading' && <StoreListLoading />}

      {storesState.status === 'error' && (
        <StateArea role="alert">
          <StateContent>
            <StateMessage>{storesState.errorMessage}</StateMessage>
            <RetryButton type="button" onClick={onRetry}>
              다시 시도
            </RetryButton>
          </StateContent>
        </StateArea>
      )}

      {storesState.status === 'success' &&
        (storesState.data.stores.length === 0 ? (
          <StateArea>
            <StateMessage>
              현재 지도 영역에는 이 가챠를 보유한 매장이 없어요.
            </StateMessage>
          </StateArea>
        ) : (
          <List ref={listRef} onScroll={handleScroll}>
            {storesState.data.stores.map((store) => (
              <ListItem key={store.storeId} data-store-id={store.storeId}>
                <StoreCard
                  store={store}
                  isSelected={selectedStoreId === store.storeId}
                  onOpen={onOpenStore}
                  onSelect={onSelectStore}
                />
              </ListItem>
            ))}
          </List>
        ))}
    </Panel>
  );
}
