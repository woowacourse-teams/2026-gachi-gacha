import styled from '@emotion/styled';
import { Link } from 'react-router';

import { createStoreDetailUrl } from '@/domains/store/storeRoute';
import { useGachaSearch } from '@/features/gachaSearch/useGachaSearch';
import { useSearchStores } from '@/routes/search/storeResults/useSearchStores';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

export const SEARCH_STORE_AREA = {
  latitude: 37.5563,
  longitude: 126.9236,
  radius: 3000,
};

export function GachaResults({
  keyword,
  preview,
  onOpen,
}: {
  keyword: string;
  preview: boolean;
  onOpen: (id: number) => string;
}) {
  const {
    searchState,
    retrySearch,
    hasMore,
    isLoadingMore,
    loadMore,
    loadMoreErrorMessage,
  } = useGachaSearch(keyword);

  return (
    <Section aria-label="가챠 결과">
      <h2>가챠</h2>
      {searchState.status === 'loading' && (
        <p role="status">가챠를 찾고 있어요.</p>
      )}
      {searchState.status === 'error' && (
        <>
          <p role="alert">{searchState.errorMessage}</p>
          <button type="button" onClick={retrySearch}>
            다시 시도
          </button>
        </>
      )}
      {searchState.status === 'success' && (
        <>
          {searchState.data.products.length === 0 && (
            <p>가챠 검색 결과가 없어요.</p>
          )}
          <List>
            {searchState.data.products
              .slice(0, preview ? 4 : undefined)
              .map((item) => (
                <Card key={item.gachaId} to={onOpen(item.gachaId)}>
                  <Thumbnail>
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" loading="lazy" />
                    ) : (
                      <LogoImagePlaceholder />
                    )}
                  </Thumbnail>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.categories.join(' · ')}</p>
                    <Availability>
                      {item.storeCount > 0
                        ? `보유 매장 ${item.storeCount}곳`
                        : '보유 매장 없음'}
                    </Availability>
                  </div>
                </Card>
              ))}
          </List>
          {!preview && loadMoreErrorMessage && (
            <p role="alert">{loadMoreErrorMessage}</p>
          )}
          {!preview && hasMore && (
            <button type="button" disabled={isLoadingMore} onClick={loadMore}>
              {isLoadingMore ? '불러오는 중...' : '더보기'}
            </button>
          )}
        </>
      )}
    </Section>
  );
}

export function StoreResults({
  keyword,
  preview,
}: {
  keyword: string;
  preview: boolean;
}) {
  const { storesState, retryStores } = useSearchStores({
    ...SEARCH_STORE_AREA,
    gachaId: null,
  });
  const query = keyword.toLocaleLowerCase();
  const matches =
    storesState.data?.stores.filter(({ name, address }) =>
      `${name} ${address}`.toLocaleLowerCase().includes(query),
    ) ?? [];

  return (
    <Section aria-label="매장 결과">
      <h2>매장</h2>
      <p>홍대 주변 매장을 검색해요.</p>
      {storesState.status === 'loading' && (
        <p role="status">매장을 찾고 있어요.</p>
      )}
      {storesState.status === 'error' && (
        <>
          <p role="alert">{storesState.errorMessage}</p>
          <button type="button" onClick={retryStores}>
            다시 시도
          </button>
        </>
      )}
      {storesState.status === 'success' && (
        <>
          {matches.length === 0 && <p>매장 검색 결과가 없어요.</p>}
          <List $store>
            {matches.slice(0, preview ? 3 : undefined).map((item) => (
              <Card
                key={item.storeId}
                to={createStoreDetailUrl(item.storeId)}
                $store
              >
                <Thumbnail>
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <LogoImagePlaceholder />
                  )}
                </Thumbnail>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.address}</p>
                </div>
              </Card>
            ))}
          </List>
        </>
      )}
    </Section>
  );
}

const Section = styled.section`
  h2 {
    margin: 0 0 12px;
    font-size: 18px;
  }
  p {
    color: #706d71;
  }
`;

const List = styled.div<{ $store?: boolean }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $store }) => ($store ? 3 : 4)},
    minmax(0, 1fr)
  );
  gap: 16px 24px;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
`;

const Card = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$store',
})<{ $store?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $store }) => ($store ? '72px minmax(0, 1fr)' : 'minmax(0, 1fr)')};
  align-items: start;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;

  p {
    margin: 4px 0;
    font-size: 13px;
  }

  @media (max-width: 767px) {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 12px;
    padding-block: 10px;
    border-bottom: 1px solid #ececef;
  }
`;

const Thumbnail = styled.div`
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 10px;
  background: #f5f4f3;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Availability = styled.span`
  color: #b52a47;
  font-size: 13px;
`;
