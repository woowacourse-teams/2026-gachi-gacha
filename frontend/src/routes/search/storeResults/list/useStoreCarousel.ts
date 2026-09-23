import { useCallback, useEffect, useRef } from 'react';

export interface UseStoreCarouselParams {
  selectedStoreId: number | null;
  onSelectStore: (storeId: number) => void;
}

export interface UseStoreCarouselResult {
  listRef: React.RefObject<HTMLUListElement | null>;
  handleScroll: () => void;
}

const SCROLL_END_DELAY_MS = 120;

function isHorizontalCarousel(list: HTMLUListElement): boolean {
  return list.scrollWidth > list.clientWidth;
}

function findNearestStoreId(list: HTMLUListElement): number | null {
  const listLeft = list.getBoundingClientRect().left;
  const scrollPadding = Number.parseFloat(getComputedStyle(list).paddingLeft);
  const snapPosition = listLeft + scrollPadding;
  const items = list.querySelectorAll<HTMLElement>('[data-store-id]');
  let nearestStoreId: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  items.forEach((item) => {
    const storeId = Number(item.dataset.storeId);
    const distance = Math.abs(item.getBoundingClientRect().left - snapPosition);

    if (Number.isInteger(storeId) && distance < nearestDistance) {
      nearestStoreId = storeId;
      nearestDistance = distance;
    }
  });

  return nearestStoreId;
}

export function useStoreCarousel({
  selectedStoreId,
  onSelectStore,
}: UseStoreCarouselParams): UseStoreCarouselResult {
  const listRef = useRef<HTMLUListElement>(null);
  const scrollEndTimerRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    const list = listRef.current;

    if (!list || !isHorizontalCarousel(list)) {
      return;
    }

    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(() => {
      const nearestStoreId = findNearestStoreId(list);

      if (nearestStoreId !== null && nearestStoreId !== selectedStoreId) {
        onSelectStore(nearestStoreId);
      }
    }, SCROLL_END_DELAY_MS);
  }, [onSelectStore, selectedStoreId]);

  useEffect(() => {
    if (selectedStoreId === null) {
      return;
    }

    const list = listRef.current;

    if (!list) {
      return;
    }

    const selectedItem = list.querySelector<HTMLElement>(
      `[data-store-id="${selectedStoreId}"]`,
    );

    if (!selectedItem) {
      return;
    }

    if (!isHorizontalCarousel(list)) {
      selectedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
      return;
    }

    const listLeft = list.getBoundingClientRect().left;
    const itemLeft = selectedItem.getBoundingClientRect().left;
    const scrollPadding = Number.parseFloat(getComputedStyle(list).paddingLeft);

    list.scrollTo({
      left: list.scrollLeft + itemLeft - listLeft - scrollPadding,
      behavior: 'smooth',
    });
  }, [selectedStoreId]);

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    },
    [],
  );

  return { listRef, handleScroll };
}
