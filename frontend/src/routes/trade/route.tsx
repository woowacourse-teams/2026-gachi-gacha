import { useSearchParams } from 'react-router';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import TradePage from './TradePage';
import { useTrades } from './useTrades';

export function TradeRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useTrades(keyword);

  function searchTrades(query: string) {
    captureAnalyticsEvent('trade_search_submitted', {
      query_length: query.length,
    });

    const nextSearchParams = new URLSearchParams();

    if (query) {
      nextSearchParams.set('keyword', query);
    }

    setSearchParams(nextSearchParams);
  }

  return (
    <TradePage
      items={state.status === 'success' ? state.data.content : []}
      query={keyword}
      status={state.status === 'idle' ? 'loading' : state.status}
      errorMessage={state.errorMessage}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      onSearch={searchTrades}
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
