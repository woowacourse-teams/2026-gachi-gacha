import { useSearchParams } from 'react-router';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import {
  parseTradeCategoryId,
  parseTradeSortOrder,
  parseTradeStatus,
} from './model/tradeListFilter';
import TradePage from './TradePage';
import { useTradeFilterCategories } from './useTradeFilterCategories';
import { useTrades } from './useTrades';

export function TradeRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const categoryId = parseTradeCategoryId(searchParams.get('categoryId'));
  const statusFilter = parseTradeStatus(searchParams.get('status'));
  const sortOrder = parseTradeSortOrder(searchParams.get('sort'));
  const { categories, status: categoryStatus } = useTradeFilterCategories();
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useTrades({ keyword, categoryId, status: statusFilter, sortOrder });

  function updateSearchParam(name: string, value: string | null) {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value === null) {
      nextSearchParams.delete(name);
    } else {
      nextSearchParams.set(name, value);
    }

    setSearchParams(nextSearchParams);
  }

  function searchTrades(query: string) {
    captureAnalyticsEvent('trade_search_submitted', {
      query_length: query.length,
    });

    updateSearchParam('keyword', query || null);
  }

  return (
    <TradePage
      items={state.status === 'success' ? state.data.content : []}
      query={keyword}
      categories={categories}
      categoryStatus={categoryStatus}
      selectedCategoryId={categoryId}
      statusFilter={statusFilter}
      sortOrder={sortOrder}
      status={state.status === 'idle' ? 'loading' : state.status}
      errorMessage={state.errorMessage}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      onSearch={searchTrades}
      onSelectCategory={(nextCategoryId) => {
        const categoryName =
          categories.find((category) => category.categoryId === nextCategoryId)
            ?.name ?? 'ALL';

        captureAnalyticsEvent('trade_filter_selected', {
          filter: 'category',
          value: categoryName,
        });
        updateSearchParam(
          'categoryId',
          nextCategoryId === null ? null : String(nextCategoryId),
        );
      }}
      onChangeStatusFilter={(nextStatus) => {
        captureAnalyticsEvent('trade_filter_selected', {
          filter: 'status',
          value: nextStatus ?? 'ALL',
        });
        updateSearchParam('status', nextStatus);
      }}
      onChangeSortOrder={(nextSortOrder) => {
        captureAnalyticsEvent('trade_filter_selected', {
          filter: 'sort',
          value: nextSortOrder,
        });
        updateSearchParam(
          'sort',
          nextSortOrder === 'latest' ? null : nextSortOrder,
        );
      }}
      onRetry={() => {
        captureAnalyticsEvent('recovery_action_selected', {
          feature: 'trade_list',
        });
        retry();
      }}
      onLoadMore={() => {
        captureAnalyticsEvent('trade_list_more_requested', {
          query_applied: Boolean(keyword),
          loaded_item_count:
            state.status === 'success' ? state.data.content.length : 0,
          source: 'trade_list',
        });
        loadMore();
      }}
    />
  );
}
