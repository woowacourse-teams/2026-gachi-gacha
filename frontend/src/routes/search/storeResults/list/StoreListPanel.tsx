import styled from '@emotion/styled';

import { AffiliateCatalogSlot } from '@/features/affiliateCatalog/AffiliateCatalogSlot';
import type { AsyncState } from '@/shared/hooks/asyncStateType';
import { breakpoint } from '@/shared/styles/tokens';

import { StoreCard } from './StoreCard';
import {
  CarouselPosition,
  CarouselPositionAnnouncement,
  Count,
  DesktopTitle,
  Header,
  List,
  ListItem,
  LoadingCard,
  LoadingList,
  MobileStatusRow,
  MobileTitle,
  Panel,
  RetryButton,
  StateArea,
  StateContent,
  StateMessage,
  Title,
} from './StoreListPanel.styles';
import { useStoreCarousel } from './useStoreCarousel';
import type { NearbyStoresResponseDto } from '../../api/nearbyStoresResponseType';

export interface StoreListPanelProps {
  storesState: AsyncState<NearbyStoresResponseDto>;
  isGachaSelected: boolean;
  affiliateCategoryNames?: readonly string[];
  affiliateTitle?: string;
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
  isGachaSelected,
  affiliateCategoryNames = [],
  affiliateTitle = '',
  selectedStoreId,
  onOpenStore,
  onSelectStore,
  onRetry,
}: StoreListPanelProps) {
  const storeCount =
    storesState.status === 'success' ? storesState.data.stores.length : null;
  const activeStoreIndex =
    storesState.status === 'success'
      ? Math.max(
          storesState.data.stores.findIndex(
            (store) => store.storeId === selectedStoreId,
          ),
          0,
        )
      : 0;
  const { listRef, handleScroll } = useStoreCarousel({
    selectedStoreId,
    onSelectStore,
  });

  return (
    <Panel aria-labelledby="search-store-list-title">
      <MobileStatusRow $showOnMobile={storeCount !== null}>
        {storesState.status === 'success' &&
          storesState.data.stores.length > 1 && (
            <CarouselPosition role="status" aria-live="polite">
              <CarouselPositionAnnouncement>
                {storesState.data.stores.length}개 매장 중{' '}
                {activeStoreIndex + 1}
                번째 매장
              </CarouselPositionAnnouncement>
              <span aria-hidden="true">
                {activeStoreIndex + 1} / {storesState.data.stores.length}
              </span>
            </CarouselPosition>
          )}

        <Header $showOnMobile={storeCount !== null}>
          <Title id="search-store-list-title">
            <DesktopTitle>
              {isGachaSelected ? '가챠 보유 매장' : '홍대 가챠 매장'}
            </DesktopTitle>
            <MobileTitle>
              {isGachaSelected ? '검색 결과' : '홍대 매장'}
            </MobileTitle>
          </Title>
          {storeCount !== null && <Count>{storeCount}곳</Count>}
        </Header>
      </MobileStatusRow>

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
              {isGachaSelected
                ? '현재 지도 영역에는 이 가챠를 보유한 매장이 없어요.'
                : '현재 지도 영역에는 등록된 가챠 매장이 없어요.'}
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

      {isGachaSelected &&
        (affiliateCategoryNames.length > 0 || affiliateTitle) && (
          <DesktopAffiliateSlot>
            <AffiliateCatalogSlot
              matchBy="content"
              categoryNames={affiliateCategoryNames}
              title={affiliateTitle}
              placementPath="/map"
            />
          </DesktopAffiliateSlot>
        )}
    </Panel>
  );
}

const DesktopAffiliateSlot = styled.div`
  padding: 24px 0 8px;

  &:empty {
    display: none;
  }

  @media (max-width: ${breakpoint.mobile}) {
    display: none;
  }
`;
