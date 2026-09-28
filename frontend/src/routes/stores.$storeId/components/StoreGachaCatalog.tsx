import { useId } from 'react';

import { GachaSummaryCard } from '@/domains/product/components/GachaSummaryCard';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import {
  CatalogHeader,
  EmptyState,
  ErrorMessage,
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
import { useStoreGachas } from '../useStoreGachas';

export interface StoreGachaCatalogProps {
  storeId: number;
}

const LOADING_CARD_COUNT = 4;

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
          <RetryButton type="button" onClick={retryStoreGachas}>
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
              {storeGachaState.data.gachas.map((gacha) => (
                <GachaItem key={gacha.gachaId}>
                  <GachaSummaryCard
                    product={gacha}
                    imageAlt={`${gacha.name} 섬네일`}
                  />
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
                    <RetryButton type="button" onClick={loadMoreStoreGachas}>
                      더 불러오기 재시도
                    </RetryButton>
                  </>
                ) : (
                  <RetryButton type="button" onClick={loadMoreStoreGachas}>
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
