import { useCallback, useEffect, useState } from 'react';

import { getTrades } from './tradeApi';
import type { TradeSummary } from './tradeTypes';

const RELATED_PAGE_SIZE = 6;
const RELATED_VISIBLE_STEP = 5;

type RelatedTradesState = {
  items: TradeSummary[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
};

export function useRelatedTrades(tradeId: number): RelatedTradesState {
  const [items, setItems] = useState<TradeSummary[]>([]);
  const [page, setPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(RELATED_VISIBLE_STEP);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setVisibleCount(RELATED_VISIBLE_STEP);
    setHasNextPage(false);
  }, [tradeId]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    getTrades({ page, signal: controller.signal, size: RELATED_PAGE_SIZE })
      .then((result) => {
        if (controller.signal.aborted) return;

        const nextItems = result.content.filter((item) => item.tradeId !== tradeId);
        setItems((currentItems) => {
          const candidates = page === 0 ? nextItems : [...currentItems, ...nextItems];
          return [...new Map(candidates.map((item) => [item.tradeId, item])).values()];
        });
        setHasNextPage(page + 1 < result.totalPages);
      })
      .catch(() => {
        if (!controller.signal.aborted) setHasNextPage(false);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [page, tradeId]);

  const loadMore = useCallback(() => {
    if (isLoading) return;

    setVisibleCount((current) => current + RELATED_VISIBLE_STEP);
    if (hasNextPage) {
      setIsLoading(true);
      setPage((current) => current + 1);
    }
  }, [hasNextPage, isLoading]);

  return {
    items: items.slice(0, visibleCount),
    hasMore: items.length > visibleCount || hasNextPage,
    isLoading,
    loadMore,
  };
}
