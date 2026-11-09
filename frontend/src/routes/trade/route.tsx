import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router';

import type { TradeSummaryPage } from '@/domains/trade/tradeSummaryType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import {
  parseTradeQuickKeyword,
  parseTradeSortOrder,
  parseTradeStatus,
} from './model/tradeListFilter';
import TradePage from './TradePage';
import { useTrades } from './useTrades';

let lastTradeVisit:
  | {
      key: string;
      pathname: string;
      search: string;
      page: TradeSummaryPage;
      scrollY: number;
    }
  | undefined;

export function TradeRoute() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoredVisit =
    navigationType === 'POP' &&
    lastTradeVisit?.key === location.key &&
    lastTradeVisit.pathname === location.pathname &&
    lastTradeVisit.search === location.search
      ? lastTradeVisit
      : undefined;

  return (
    <TradeRouteContent key={restoredVisit?.key} restoredVisit={restoredVisit} />
  );
}

function TradeRouteContent({
  restoredVisit,
}: {
  restoredVisit: typeof lastTradeVisit;
}) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const quickKeyword = keyword
    ? null
    : parseTradeQuickKeyword(searchParams.get('quickKeyword'));
  const effectiveKeyword = keyword || quickKeyword || '';
  const statusFilter = parseTradeStatus(searchParams.get('status'));
  const sortOrder = parseTradeSortOrder(searchParams.get('sort'));
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useTrades(
      { keyword: effectiveKeyword, status: statusFilter, sortOrder },
      restoredVisit?.page,
    );

  useLayoutEffect(() => {
    if (restoredVisit) {
      const frame = window.requestAnimationFrame(() => {
        window.scrollTo(0, restoredVisit.scrollY);
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [restoredVisit]);

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
      onOpenTrade={() => {
        if (state.status === 'success') {
          lastTradeVisit = {
            key: location.key,
            pathname: location.pathname,
            search: location.search,
            page: state.data,
            scrollY: window.scrollY,
          };
        }
      }}
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
