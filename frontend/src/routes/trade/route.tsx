import { useSearchParams } from 'react-router';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import {
  parseTradeQuickKeyword,
  parseTradeSortOrder,
  parseTradeStatus,
} from './model/tradeListFilter';
import TradePage from './TradePage';
import { useTrades } from './useTrades';

export function TradeRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const quickKeyword = keyword
    ? null
    : parseTradeQuickKeyword(searchParams.get('quickKeyword'));
  const effectiveKeyword = keyword || quickKeyword || '';
  const statusFilter = parseTradeStatus(searchParams.get('status'));
  const sortOrder = parseTradeSortOrder(searchParams.get('sort'));
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useTrades({ keyword: effectiveKeyword, status: statusFilter, sortOrder });

  function updateSearchParams(updates: Record<string, string | null>) {
    const nextSearchParams = new URLSearchParams(searchParams);

    for (const [name, value] of Object.entries(updates)) {
      if (value === null) {
        nextSearchParams.delete(name);
      } else {
        nextSearchParams.set(name, value);
      }
    }

    setSearchParams(nextSearchParams);
  }

  function searchTrades(query: string) {
    captureAnalyticsEvent('trade_search_submitted', {
      query_length: query.length,
    });

    updateSearchParams({
      keyword: query || null,
      quickKeyword: null,
      categoryId: null,
    });
  }

  return (
    <TradePage
      items={state.status === 'success' ? state.data.content : []}
      query={keyword}
      selectedQuickKeyword={quickKeyword}
      statusFilter={statusFilter}
      sortOrder={sortOrder}
      status={state.status === 'idle' ? 'loading' : state.status}
      errorMessage={state.errorMessage}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      onSearch={searchTrades}
      onSelectQuickKeyword={(nextQuickKeyword) => {
        captureAnalyticsEvent('trade_filter_selected', {
          filter: 'category',
          value: nextQuickKeyword ?? 'ALL',
        });
        updateSearchParams({
          keyword: nextQuickKeyword === null ? keyword || null : null,
          quickKeyword: nextQuickKeyword,
          categoryId: null,
        });
      }}
      onChangeStatusFilter={(nextStatus) => {
        captureAnalyticsEvent('trade_filter_selected', {
          filter: 'status',
          value: nextStatus ?? 'ALL',
        });
        updateSearchParams({ status: nextStatus });
      }}
      onChangeSortOrder={(nextSortOrder) => {
        captureAnalyticsEvent('trade_filter_selected', {
          filter: 'sort',
          value: nextSortOrder,
        });
        updateSearchParams({
          sort: nextSortOrder === 'latest' ? null : nextSortOrder,
        });
      }}
      onRetry={() => {
        captureAnalyticsEvent('recovery_action_selected', {
          feature: 'trade_list',
        });
        retry();
      }}
      onLoadMore={() => {
        captureAnalyticsEvent('trade_list_more_requested', {
          query_applied: Boolean(effectiveKeyword),
          loaded_item_count:
            state.status === 'success' ? state.data.content.length : 0,
          source: 'trade_list',
        });
        loadMore();
      }}
    />
  );
}
