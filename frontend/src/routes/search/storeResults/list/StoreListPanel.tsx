import { useRef, useState } from 'react';
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const dragStartRef = useRef<number | null>(null);

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
      <ListButton
        type="button"
        onClick={() => {
          setIsSheetOpen(true);
          sheetRef.current?.showModal();
        }}
      >
        ☷ 목록 보기
      </ListButton>
      <ListSheet
        ref={sheetRef}
        onClose={() => setIsSheetOpen(false)}
        aria-label="매장 목록"
        onClick={(event) => {
          if (event.target === event.currentTarget) sheetRef.current?.close();
        }}
      >
        {isSheetOpen && (
          <>
            <SheetHandle
              type="button"
              aria-label="매장 목록 닫기"
              onClick={() => sheetRef.current?.close()}
              onPointerDown={(event) => {
                dragStartRef.current = event.clientY;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                if (
                  dragStartRef.current !== null &&
                  event.clientY - dragStartRef.current > 60
                ) {
                  sheetRef.current?.close();
                }
                dragStartRef.current = null;
              }}
            >
              <span />
            </SheetHandle>
            <h2>홍대 매장{storeCount === null ? '' : ` ${storeCount}곳`}</h2>
            {storesState.status === 'success' && (
              <SheetList>
                {storesState.data.stores.map((store) => (
                  <li key={store.storeId}>
                    <StoreCard
                      store={store}
                      isSelected={selectedStoreId === store.storeId}
                      onOpen={(id) => {
                        onSelectStore(id);
                        sheetRef.current?.close();
                      }}
                      onSelect={(id) => {
                        onSelectStore(id);
                        sheetRef.current?.close();
                      }}
                    />
                  </li>
                ))}
                {storesState.data.stores.length === 0 && (
                  <li>현재 지도 영역에 매장이 없어요.</li>
                )}
              </SheetList>
            )}
            {storesState.status === 'loading' && (
              <p role="status">매장을 불러오고 있어요.</p>
            )}
            {storesState.status === 'error' && (
              <div>
                <p role="alert">{storesState.errorMessage}</p>
                <RetryButton type="button" onClick={onRetry}>
                  다시 시도
                </RetryButton>
              </div>
            )}
          </>
        )}
      </ListSheet>
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

const ListButton = styled.button`
  display: none;

  @media (max-width: 767px) {
    display: block;
    min-height: 40px;
    margin: 0 0 10px 12px;
    padding: 0 14px;
    border: 1px solid #e7e4e2;
    border-radius: 999px;
    background: #fff;
    color: inherit;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
`;

const ListSheet = styled.dialog`
  position: fixed;
  inset: auto 0 0;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: min(70dvh, 620px);
  max-height: 85dvh;
  margin: 0;
  padding: 0 16px calc(20px + env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 0;
  border-radius: 20px 20px 0 0;
  background: #fff;
  color: inherit;

  &::backdrop {
    background: rgb(0 0 0 / 28%);
  }
  h2 {
    margin: 0 0 12px;
    font-size: 18px;
  }
`;

const SheetHandle = styled.button`
  display: grid;
  width: 100%;
  height: 40px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  touch-action: none;
  cursor: pointer;

  span {
    width: 40px;
    height: 4px;
    border-radius: 4px;
    background: #d9d5d3;
  }
`;

const SheetList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    border-bottom: 1px solid #ececef;
  }
  button {
    min-height: 100px;
    height: auto;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
`;
