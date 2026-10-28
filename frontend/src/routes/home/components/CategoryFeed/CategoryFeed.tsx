import { useState } from 'react';
import styled from '@emotion/styled';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import { DEFAULT_CATEGORY } from '../../model/categories';
import CardListSection from '../CardListSection';
import CategoryNav from '../CategoryNav';
import { useInfiniteCategoryGachas } from './useInfiniteCategoryGachas';

export default function CategoryFeed() {
  const [selectedCategory, selectCategory] = useState(DEFAULT_CATEGORY);

  function handleSelectCategory(categoryName: string) {
    captureAnalyticsEvent('category_selected', {
      category_name: categoryName,
    });
    selectCategory(categoryName);
  }

  return (
    <>
      <CategoryNav
        selected={selectedCategory}
        onSelect={handleSelectCategory}
      />
      <CategoryFeedContent categoryName={selectedCategory} />
    </>
  );
}

interface CategoryFeedContentProps {
  categoryName: string;
}

function CategoryFeedContent({ categoryName }: CategoryFeedContentProps) {
  const { itemsState, hasNextPage, loadMoreStatus, loadNextPage } =
    useInfiniteCategoryGachas(categoryName);

  function loadMore() {
    captureAnalyticsEvent('category_feed_more_requested', {
      category_name: categoryName,
      loaded_item_count:
        itemsState.status === 'success' ? itemsState.data.length : 0,
    });
    loadNextPage();
  }

  if (itemsState.status === 'idle') return null;

  if (itemsState.status === 'loading') {
    return (
      <SectionList>
        <Message role="status">불러오는 중이에요.</Message>
      </SectionList>
    );
  }

  if (itemsState.status === 'error') {
    return (
      <SectionList>
        <Message role="alert">목록을 불러오지 못했어요.</Message>
      </SectionList>
    );
  }

  return (
    <SectionList>
      <CardListSection
        title={categoryName}
        items={itemsState.data}
        hasNextPage={hasNextPage}
        loadMoreStatus={loadMoreStatus}
        onEndReached={loadMore}
      />
    </SectionList>
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
