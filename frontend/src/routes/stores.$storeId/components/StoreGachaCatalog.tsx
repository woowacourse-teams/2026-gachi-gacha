import { useId } from 'react';

import { GachaSummaryCard } from '@/domains/product/components/GachaSummaryCard';
import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import {
  CatalogHeader,
  EmptyState,
  ErrorMessage,
  GachaLink,
  GachaItem,
  GachaList,
  LoadMoreArea,
  LoadingCard,
  LoadingGrid,
  ResultCount,
  RetryButton,
  Section,
  SectionTitle,
  StatusText,
} from './StoreGachaCatalog.styles';
import type { StoreGachaSummary } from '../api/storeGachaType';
import { useStoreGachas } from '../useStoreGachas';

export interface StoreGachaCatalogProps {
  storeId: number;
}

const LOADING_CARD_COUNT = 4;

interface StoreGachaCardProps {
  gacha: StoreGachaSummary;
  resultPosition: number;
}

function StoreGachaCard({ gacha, resultPosition }: StoreGachaCardProps) {
  return (
    <GachaLink
      to={createGachaSearchResultsUrl(gacha.gachaId)}
      aria-label={`${gacha.gachaName} 보유 매장 지도에서 보기`}
      onClick={() =>
        captureAnalyticsEvent('gacha_selected', {
          gacha_id: gacha.gachaId,
          result_position: resultPosition,
          source: 'store_catalog',
        })
      }
    >
      <GachaSummaryCard
        product={{
          name: gacha.gachaName,
          thumbnailUrl: gacha.thumbnailUrl,
        }}
        imageAlt={`${gacha.gachaName} 섬네일`}
      />
    </GachaLink>
  );
}

export function StoreGachaCatalog({ storeId }: StoreGachaCatalogProps) {
  const titleId = useId();
  const {
    storeGachaState,
    hasMore,
    isLoadingMore,
    loadMoreErrorMessage,
    retryStoreGachas,
    loadMoreStoreGachas,
  } = useStoreGachas(storeId);
  const loadedItemCount =
    storeGachaState.status === 'success'
      ? storeGachaState.data.gachas.length
      : 0;

  function loadMore() {
    captureAnalyticsEvent('store_catalog_more_requested', {
      store_id: storeId,
      loaded_item_count: loadedItemCount,
    });
    loadMoreStoreGachas();
  }

  return (
    <Section aria-labelledby={titleId}>
      <CatalogHeader>
        <SectionTitle id={titleId}>이 매장의 가챠</SectionTitle>
        {storeGachaState.status === 'success' && (
          <ResultCount>
            {storeGachaState.data.totalCount.toLocaleString('ko-KR')}종
          </ResultCount>
        )}
      </CatalogHeader>

      {storeGachaState.status === 'loading' && (
        <LoadingGrid aria-label="매장 보유 가챠를 불러오는 중" aria-busy="true">
          {Array.from({ length: LOADING_CARD_COUNT }, (_, index) => (
            <LoadingCard key={index} aria-hidden="true">
              <LogoImagePlaceholder />
            </LoadingCard>
          ))}
        </LoadingGrid>
      )}

      {storeGachaState.status === 'error' && (
        <EmptyState role="alert">
          <ErrorMessage>{storeGachaState.errorMessage}</ErrorMessage>
          <RetryButton
            type="button"
            onClick={() => {
              captureAnalyticsEvent('recovery_action_selected', {
                feature: 'store_catalog',
              });
              retryStoreGachas();
            }}
          >
            다시 시도
          </RetryButton>
        </EmptyState>
      )}

      {storeGachaState.status === 'success' &&
        storeGachaState.data.gachas.length === 0 && (
          <EmptyState>등록된 보유 가챠가 아직 없어요.</EmptyState>
        )}

      {storeGachaState.status === 'success' &&
        storeGachaState.data.gachas.length > 0 && (
          <>
            <GachaList>
              {storeGachaState.data.gachas.map((gacha, index) => (
                <GachaItem key={gacha.gachaId}>
                  <StoreGachaCard gacha={gacha} resultPosition={index + 1} />
                </GachaItem>
              ))}
            </GachaList>

            {(hasMore || isLoadingMore || loadMoreErrorMessage) && (
              <LoadMoreArea>
                {isLoadingMore ? (
                  <StatusText role="status">
                    가챠를 더 불러오고 있어요.
                  </StatusText>
                ) : loadMoreErrorMessage ? (
                  <>
                    <ErrorMessage>{loadMoreErrorMessage}</ErrorMessage>
                    <RetryButton type="button" onClick={loadMore}>
                      더 불러오기 재시도
                    </RetryButton>
                  </>
                ) : (
                  <RetryButton type="button" onClick={loadMore}>
                    더 보기
                  </RetryButton>
                )}
              </LoadMoreArea>
            )}
          </>
        )}
    </Section>
  );
}
