import type { UIEvent } from 'react';

import { GachaSummaryCard } from '@/domains/product/components/GachaSummaryCard';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { captureGachaSelected } from './analytics/gachaSearchAnalytics';
import {
  CloseButton,
  Content,
  EmptyState,
  ErrorMessage,
  Header,
  HelperText,
  LoadingCard,
  LoadingGrid,
  LoadMoreError,
  LoadMoreStatus,
  Popover,
  ProductButton,
  ProductItem,
  ProductList,
  ResultCount,
  ResultSummary,
  RetryButton,
  StoreCountText,
  Title,
} from './GachaSearchPopover.styles';
import type {
  GachaSearchProduct,
  GachaSearchResult,
} from './gachaSearchResultType';
import { getVisibleCategories } from './getVisibleCategories';

export interface GachaSearchPopoverProps {
  id?: string;
  query: string;
  searchState: AsyncState<GachaSearchResult>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreErrorMessage?: string | null;
  onClose: () => void;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onSelect: (gachaId: number) => void;
}

const LOAD_MORE_THRESHOLD = 120;

interface ProductCardProps {
  product: GachaSearchProduct;
  query: string;
  resultPosition: number;
  onSelect: (gachaId: number) => void;
}

function ProductCard({
  product,
  query,
  resultPosition,
  onSelect,
}: ProductCardProps) {
  const visibleCategories = getVisibleCategories(product.categories, query);
  const hiddenCategoryCount = Math.max(
    product.categories.length - visibleCategories.length,
    0,
  );
  const categoryPreview = visibleCategories.join(' · ');
  const categoryLabel = hiddenCategoryCount
    ? `${categoryPreview} 외 ${hiddenCategoryCount}개`
    : categoryPreview;
  const hasStore = product.storeCount > 0;
  const storeCountLabel = hasStore
    ? `${product.storeCount.toLocaleString('ko-KR')}개 매장 보유중`
    : '보유 매장 없음';

  return (
    <ProductItem>
      <ProductButton
        type="button"
        disabled={!hasStore}
        onClick={() => {
          captureGachaSelected(product.gachaId, resultPosition);
          onSelect(product.gachaId);
        }}
        aria-label={
          hasStore
            ? `${product.name} 선택, ${storeCountLabel}`
            : `${product.name}, 보유 매장 없음`
        }
        title={hasStore ? undefined : '현재 보유 중인 매장이 없습니다.'}
      >
        <GachaSummaryCard
          product={product}
          categoryLabel={categoryLabel}
          supportingContent={<StoreCountText>{storeCountLabel}</StoreCountText>}
        />
      </ProductButton>
    </ProductItem>
  );
}

function LoadingContent() {
  return (
    <LoadingGrid aria-label="가챠 검색 결과를 불러오는 중" aria-busy="true">
      {Array.from({ length: 10 }, (_, index) => (
        <LoadingCard key={index} aria-hidden="true" />
      ))}
    </LoadingGrid>
  );
}

export function GachaSearchPopover({
  id,
  query,
  searchState,
  hasMore = false,
  isLoadingMore = false,
  loadMoreErrorMessage = null,
  onClose,
  onLoadMore,
  onRetry,
  onSelect,
}: GachaSearchPopoverProps) {
  const trimmedQuery = query.trim();

  function handleContentScroll(event: UIEvent<HTMLDivElement>) {
    if (!hasMore || isLoadingMore || loadMoreErrorMessage || !onLoadMore) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
    const remainingScroll = scrollHeight - scrollTop - clientHeight;

    if (remainingScroll <= LOAD_MORE_THRESHOLD) {
      onLoadMore();
    }
  }

  return (
    <Popover id={id} aria-label="가챠 검색 결과">
      <Header>
        <div>
          <Title>
            {trimmedQuery ? `‘${trimmedQuery}’ 검색 결과` : '가챠 검색'}
          </Title>
          <HelperText>
            가챠를 선택하면 보유 매장과 위치를 확인할 수 있어요.
          </HelperText>
        </div>
        <CloseButton
          type="button"
          onClick={onClose}
          aria-label="검색 결과 닫기"
        >
          ×
        </CloseButton>
      </Header>

      <Content aria-live="polite" onScroll={handleContentScroll}>
        {searchState.status === 'idle' && (
          <EmptyState>찾고 싶은 캐릭터나 카테고리를 입력해 주세요.</EmptyState>
        )}

        {searchState.status === 'loading' && <LoadingContent />}

        {searchState.status === 'error' && (
          <EmptyState>
            <ErrorMessage>{searchState.errorMessage}</ErrorMessage>
            {onRetry && (
              <RetryButton type="button" onClick={onRetry}>
                다시 시도
              </RetryButton>
            )}
          </EmptyState>
        )}

        {searchState.status === 'success' &&
          searchState.data.products.length === 0 && (
            <EmptyState>검색어와 관련된 가챠가 없습니다.</EmptyState>
          )}

        {searchState.status === 'success' &&
          searchState.data.products.length > 0 && (
            <>
              <ResultSummary>
                <span>관련 가챠</span>
                <ResultCount>
                  {searchState.data.totalCount.toLocaleString('ko-KR')}개의 결과
                </ResultCount>
              </ResultSummary>
              <ProductList>
                {searchState.data.products.map((product, index) => (
                  <ProductCard
                    key={product.gachaId}
                    product={product}
                    query={trimmedQuery}
                    resultPosition={index + 1}
                    onSelect={onSelect}
                  />
                ))}
              </ProductList>
              {isLoadingMore && (
                <LoadMoreStatus role="status">
                  검색 결과를 더 불러오는 중이에요.
                </LoadMoreStatus>
              )}
              {loadMoreErrorMessage && (
                <LoadMoreError>
                  <ErrorMessage>{loadMoreErrorMessage}</ErrorMessage>
                  {onLoadMore && (
                    <RetryButton type="button" onClick={onLoadMore}>
                      더 불러오기 재시도
                    </RetryButton>
                  )}
                </LoadMoreError>
              )}
              {hasMore && !isLoadingMore && !loadMoreErrorMessage && (
                <LoadMoreStatus>
                  아래로 스크롤해 더 확인해 보세요.
                </LoadMoreStatus>
              )}
            </>
          )}
      </Content>
    </Popover>
  );
}
