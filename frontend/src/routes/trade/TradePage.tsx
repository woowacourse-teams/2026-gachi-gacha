import styled from '@emotion/styled';

import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import {
  breakpoint,
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';

import CreateTradeButton from './components/CreateTradeButton';
import ProductCard from './components/ProductCard';
import ScrollToTopButton from './components/ScrollToTopButton';
import SearchHero from './components/SearchHero';
import { TradeFilters } from './components/TradeFilters';
import type { TradeItem } from './model/tradeItem';
import type {
  TradeQuickKeyword,
  TradeSortOrder,
} from './model/tradeListFilter';

interface TradePageProps {
  items: TradeItem[];
  query?: string;
  selectedQuickKeyword?: TradeQuickKeyword | null;
  statusFilter?: TradeStatus | null;
  sortOrder?: TradeSortOrder;
  status?: 'loading' | 'success' | 'error';
  errorMessage?: string | null;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreError?: string | null;
  onOpenTrade?: () => void;
  onSearch?: (query: string) => void;
  onSelectQuickKeyword?: (keyword: TradeQuickKeyword | null) => void;
  onChangeStatusFilter?: (status: TradeStatus | null) => void;
  onChangeSortOrder?: (sortOrder: TradeSortOrder) => void;
  onRetry?: () => void;
  onLoadMore?: () => void;
}

export default function TradePage({
  items,
  query = '',
  selectedQuickKeyword = null,
  statusFilter = null,
  sortOrder = 'latest',
  status = 'success',
  errorMessage = null,
  hasMore = false,
  isLoadingMore = false,
  loadMoreError = null,
  onOpenTrade,
  onSearch = () => undefined,
  onSelectQuickKeyword = () => undefined,
  onChangeStatusFilter = () => undefined,
  onChangeSortOrder = () => undefined,
  onRetry,
  onLoadMore,
}: TradePageProps) {
  const hasActiveFilter =
    Boolean(query) || selectedQuickKeyword !== null || statusFilter !== null;
  const resultsTitle = query
    ? `‘${query}’ 검색결과`
    : selectedQuickKeyword
      ? `${selectedQuickKeyword} 교환글`
      : sortOrder === 'oldest'
        ? '오래된순'
        : '최신순';

  return (
    <Page>
      <AppHeader
        currentPath="/trade"
        showMobileTabs
        desktopAction={<CreateTradeButton placement="header" />}
        search={<SearchHero initialQuery={query} onSearch={onSearch} />}
      />

      <Main>
        <ResultsPanel aria-live="polite">
          <TradeFilters
            selectedQuickKeyword={selectedQuickKeyword}
            status={statusFilter}
            sortOrder={sortOrder}
            onSelectQuickKeyword={onSelectQuickKeyword}
            onChangeStatus={onChangeStatusFilter}
            onChangeSortOrder={onChangeSortOrder}
          />

          <ResultsTitle>{resultsTitle}</ResultsTitle>

          {status === 'loading' ? (
            <LoadingStateMessage role="status">
              교환 게시글을 불러오는 중...
            </LoadingStateMessage>
          ) : status === 'error' ? (
            <StateBox role="alert">
              <StateMessage>
                {errorMessage || '교환 게시글을 불러오지 못했습니다.'}
              </StateMessage>
              {onRetry && (
                <RetryButton type="button" onClick={onRetry}>
                  다시 시도
                </RetryButton>
              )}
            </StateBox>
          ) : items.length > 0 ? (
            <>
              <ProductGrid>
                {items.map((item, index) => (
                  <ProductCard
                    key={item.tradeId}
                    item={item}
                    eagerImage={index < 4}
                    homeLayout
                    onOpen={onOpenTrade}
                  />
                ))}
              </ProductGrid>
              {loadMoreError && (
                <LoadMoreError role="alert">{loadMoreError}</LoadMoreError>
              )}
              {hasMore && onLoadMore && (
                <LoadMoreButton
                  type="button"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                >
                  {isLoadingMore ? '불러오는 중...' : '더보기'}
                </LoadMoreButton>
              )}
            </>
          ) : (
            <EmptyState>
              {hasActiveFilter
                ? '선택한 조건에 맞는 교환 게시글이 없어요.'
                : '아직 등록된 교환 게시글이 없어요.'}
            </EmptyState>
          )}
        </ResultsPanel>
      </Main>

      <ScrollToTopButton />
      <CreateTradeButton placement="mobile" />
    </Page>
  );
}

const Page = styled.div`
  --trade-mobile-tab-height: 56px;

  min-height: 100dvh;
  background: ${color.surface};
`;

const Main = styled.main`
  display: flex;
  box-sizing: border-box;
  width: 100%;
  margin: 0 auto;
  /* 하단 여백은 우측 하단 등록 버튼이 마지막 콘텐츠를 가리지 않도록 버튼 높이만큼 더 둔다. */
  padding: 0 0 64px;
  flex-direction: column;

  @media (max-width: ${breakpoint.mobile}) {
    padding-bottom: calc(
      96px + var(--trade-mobile-tab-height) + env(safe-area-inset-bottom)
    );
  }
`;

const ResultsPanel = styled.section`
  --trade-grid-max-width: 1200px;

  box-sizing: border-box;
  width: 100%;
  max-width: 1264px;
  margin: 0 auto;
  padding: 28px 32px 0;
  background: ${color.surface};

  @media (max-width: 1327px) {
    padding-inline: 24px;
  }

  @media (max-width: 1003px) {
    --trade-grid-max-width: 711px;
  }

  @media (max-width: ${breakpoint.mobile}) {
    --trade-grid-max-width: none;
    margin: 0;
    padding: 4px 16px 0;
  }
`;

const ResultsTitle = styled.h2`
  width: 100%;
  max-width: var(--trade-grid-max-width);
  margin: ${space.xl} auto 0;
  color: ${color.text};
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.bold};

  @media (max-width: ${breakpoint.mobile}) {
    margin-top: 6px;
    font-size: 14px;
  }

  @media (min-width: 768px) {
    position: absolute;
    clip-path: inset(50%);
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  width: 100%;
  max-width: var(--trade-grid-max-width);
  margin: 24px auto 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-content: center;
  gap: 32px 24px;

  @media (max-width: 1003px) {
    grid-template-columns: repeat(3, minmax(0, 221px));
  }

  @media (max-width: ${breakpoint.mobile}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    margin-top: 0;

    & > a {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border: 0;
      border-bottom: 1px solid ${color.borderSubtle};
      border-radius: 0;
      box-shadow: none;
    }
  }
`;

const EmptyState = styled.p`
  margin: 0;
  padding: ${space.huge} ${space.md};
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  text-align: center;
`;

const StateBox = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: ${space.md};
  padding: ${space.huge} ${space.md};
`;

const StateMessage = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  text-align: center;
`;

const LoadingStateMessage = styled(StateMessage)`
  padding: ${space.huge} ${space.md};
`;

const RetryButton = styled.button`
  padding: ${space.sm} ${space.lg};
  border: 0;
  border-radius: ${radius.control};
  background: ${color.primary};
  color: ${color.surface};
  font-weight: ${fontWeight.bold};
  cursor: pointer;
`;

const LoadMoreError = styled(StateMessage)`
  margin-top: ${space.xl};
  color: ${color.primary};
`;

const LoadMoreButton = styled.button`
  display: block;
  width: min(240px, 100%);
  min-height: 48px;
  margin: 32px auto 0;
  padding: 0 ${space.xl};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;
