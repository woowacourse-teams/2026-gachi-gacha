import styled from '@emotion/styled';

import CardListSection from '../CardListSection';
import CategoryNav from '../CategoryNav';
import { useCategoryFeed } from './useCategoryFeed';

export default function CategoryFeed() {
  const {
    selectedCategory,
    selectCategory,
    itemsState,
    hasNextPage,
    isLoadingMore,
    loadMoreError,
    loadNextPage,
  } = useCategoryFeed();

  return (
    <>
      <CategoryNav selected={selectedCategory} onSelect={selectCategory} />

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
            hasNextPage={hasNextPage}
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
