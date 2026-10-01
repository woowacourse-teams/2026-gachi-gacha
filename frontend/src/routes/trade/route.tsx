import { useSearchParams } from 'react-router';

import TradePage from './TradePage';
import { useTrades } from './useTrades';

export function TradeRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useTrades(keyword);

  function searchTrades(query: string) {
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
      onRetry={retry}
      onLoadMore={loadMore}
    />
  );
}
