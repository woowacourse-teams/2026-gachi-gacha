import styled from '@emotion/styled';

import ProductCard from '@/routes/trade/components/ProductCard';
import { useTrades } from '@/routes/trade/useTrades';

export default function TradeSearchResults({
  keyword,
  preview,
}: {
  keyword: string;
  preview: boolean;
}) {
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useTrades({ keyword, status: null, sortOrder: 'latest' });

  return (
    <section aria-label="교환글 결과">
      <Heading>교환글</Heading>
      {state.status === 'loading' && <p role="status">교환글을 찾고 있어요.</p>}
      {state.status === 'error' && (
        <>
          <p role="alert">{state.errorMessage}</p>
          <Action type="button" onClick={retry}>
            다시 시도
          </Action>
        </>
      )}
      {state.status === 'success' && (
        <>
          {state.data.content.length === 0 ? (
            <p role="status">검색 결과가 없어요.</p>
          ) : (
            <Cards>
              {state.data.content
                .slice(0, preview ? 4 : undefined)
                .map((item) => (
                  <ProductCard key={item.tradeId} item={item} homeLayout />
                ))}
            </Cards>
          )}
          {!preview && loadMoreError && <p role="alert">{loadMoreError}</p>}
          {!preview && hasMore && (
            <Action
              type="button"
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
            >
              {isLoadingMore
                ? '불러오는 중...'
                : loadMoreError
                  ? '다시 시도'
                  : '더보기'}
            </Action>
          )}
        </>
      )}
    </section>
  );
}

const Heading = styled.h2`
  margin: 0 0 12px;
  font-size: 18px;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 32px 24px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;

    > a {
      display: grid;
      grid-template-columns: minmax(0, 96px) minmax(0, 1fr);
      gap: 12px;
      max-width: none;
      padding: 12px 0;
      border: 0;
      border-bottom: 1px solid #ececef;
      border-radius: 0;
      box-shadow: none;
    }
  }
`;

const Action = styled.button`
  display: block;
  min-width: 160px;
  min-height: 44px;
  margin: 24px auto 0;
  border: 1px solid #e2dfe0;
  border-radius: 10px;
  background: #fff;
  color: inherit;
  font: inherit;
  cursor: pointer;
`;
