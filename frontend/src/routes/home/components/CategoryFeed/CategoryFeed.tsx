import { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

import type { AsyncState } from '@/types/asyncState';

import { getCategoryGachas } from '../../api/getCategoryGachas';
import type { CategoryGacha } from '../../api/getCategoryGachas';
import { DEFAULT_CATEGORY } from '../../model/categories';
import CardListSection from '../CardListSection';
import CategoryNav from '../CategoryNav';

export default function CategoryFeed() {
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [itemsState, setItemsState] = useState<AsyncState<CategoryGacha[]>>({
    status: 'loading',
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    isLoadingMoreRef.current = false;

    const fetchCategoryGachas = async () => {
      setItemsState({ status: 'loading' });
      setPage(0);
      setTotalPages(0);
      setIsLoadingMore(false);
      setLoadMoreError(false);

      try {
        const firstPage = await getCategoryGachas(selectedCategory, 0, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setItemsState({
          status: 'success',
          data: firstPage.content,
        });
        setPage(firstPage.number);
        setTotalPages(firstPage.totalPages);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        setItemsState({
          status: 'error',
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    void fetchCategoryGachas();

    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [selectedCategory]);

  const loadNextPage = useCallback(() => {
    if (
      itemsState.status !== 'success' ||
      isLoadingMoreRef.current ||
      page + 1 >= totalPages
    ) {
      return;
    }

    const nextPage = page + 1;
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    const fetchNextPage = async () => {
      try {
        const nextPageData = await getCategoryGachas(
          selectedCategory,
          nextPage,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        setItemsState((currentState) => {
          if (currentState.status !== 'success') return currentState;

          const loadedIds = new Set(
            currentState.data.map((gacha) => gacha.gachaId),
          );
          const newItems = nextPageData.content.filter(
            (gacha) => !loadedIds.has(gacha.gachaId),
          );

          return {
            status: 'success',
            data: [...currentState.data, ...newItems],
          };
        });
        setPage(nextPageData.number);
        setTotalPages(nextPageData.totalPages);
      } catch {
        if (!controller.signal.aborted) setLoadMoreError(true);
      } finally {
        if (loadMoreControllerRef.current === controller) {
          isLoadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    };

    void fetchNextPage();
  }, [itemsState.status, page, selectedCategory, totalPages]);

  return (
    <>
      <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} />

      <SectionList>
        {itemsState.status === 'loading' && (
          <Message role="status">불러오는 중이에요.</Message>
        )}

        {itemsState.status === 'error' && (
          <Message role="alert">목록을 불러오지 못했어요.</Message>
        )}

        {itemsState.status === 'success' && (
          <CardListSection
            title={selectedCategory}
            items={itemsState.data.map((gacha) => ({
              id: gacha.gachaId,
              imageUrl: gacha.thumbnailUrl,
              name: gacha.name,
            }))}
            hasNextPage={page + 1 < totalPages}
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            onEndReached={loadNextPage}
          />
        )}
      </SectionList>
    </>
  );
}

const SectionList = styled.div`
  width: 100%;
  max-width: 1328px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 16px 0;
`;

const Message = styled.p`
  margin: 24px 0;
  font-size: 14px;
  color: #9a9095;
  text-align: center;
`;
