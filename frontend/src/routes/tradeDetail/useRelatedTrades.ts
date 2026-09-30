import { useCallback, useEffect, useState } from 'react';

import { getTrades } from '@/domains/trade/api/getTrades';
import type { TradeSummary } from '@/domains/trade/tradeSummaryType';

const RELATED_ITEM_PAGE_SIZE = 6;
const RELATED_ITEM_VISIBLE_STEP = 5;

interface RelatedTradesResult {
  items: TradeSummary[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
}

export function useRelatedTrades(tradeId: number): RelatedTradesResult {
  const [items, setItems] = useState<TradeSummary[]>([]);
  const [page, setPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(RELATED_ITEM_VISIBLE_STEP);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setVisibleCount(RELATED_ITEM_VISIBLE_STEP);
    setHasNextPage(false);
  }, [tradeId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRelatedTrades() {
      setIsLoading(true);

      try {
        const data = await getTrades({
          page,
          size: RELATED_ITEM_PAGE_SIZE,
          sort: 'createdAt,desc',
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const nextItems = data.content.filter(
          (item) => item.tradeId !== tradeId,
        );

        setItems((currentItems) =>
          page === 0 ? nextItems : [...currentItems, ...nextItems],
        );
        setHasNextPage(page + 1 < data.totalPages);
      } catch {
        if (!controller.signal.aborted) {
          setHasNextPage(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRelatedTrades();

    return () => controller.abort();
  }, [page, tradeId]);

  const loadMore = useCallback(() => {
    if (isLoading) {
      return;
    }

    setVisibleCount(
      (currentVisibleCount) => currentVisibleCount + RELATED_ITEM_VISIBLE_STEP,
    );

    if (hasNextPage) {
      setPage((currentPage) => currentPage + 1);
    }
  }, [hasNextPage, isLoading]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount || hasNextPage;

  return { items: visibleItems, hasMore, isLoading, loadMore };
}
