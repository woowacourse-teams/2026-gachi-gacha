import styled from '@emotion/styled';
import { Link, useLocation, useSearchParams } from 'react-router';

import { AppHeader } from '@/shared/ui/AppHeader';
import { HeaderSearch } from '@/shared/ui/HeaderSearch';

import CategoryFeed from './components/CategoryFeed';
import GachaSearchDetail from './components/GachaSearchDetail';
import { GachaResults, StoreResults } from './components/SearchCatalogResults';
import SearchHero from './components/SearchHero';
import TradeSearchResults from './components/TradeSearchResults';

const SEARCH_TABS = [
  { id: 'all', label: '전체' },
  { id: 'trade', label: '교환글' },
  { id: 'gacha', label: '가챠' },
  { id: 'store', label: '매장' },
] as const;

type SearchTab = (typeof SEARCH_TABS)[number]['id'];

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const storeDetailFrom =
    typeof location.state?.storeDetailFrom === 'string' &&
    /^\/stores\/[1-9]\d*$/.test(location.state.storeDetailFrom)
      ? location.state.storeDetailFrom
      : null;
  const backTo = location.state?.searchFrom === '/map' ? '/map' : '/trade';
  const keyword = params.get('keyword')?.trim() ?? '';
  const tab =
    SEARCH_TABS.find(({ id }) => id === params.get('tab'))?.id ?? 'all';
  const product = Number(params.get('product'));
  const productId =
    Number.isSafeInteger(product) && product > 0 ? product : null;

  const isProductDetail = Boolean(keyword) && productId !== null;

  function resultUrl(nextTab: SearchTab, nextProduct?: number) {
    const next = new URLSearchParams(params);
    next.set('tab', nextTab);
    next.delete('product');

    if (nextProduct !== undefined) {
      next.set('product', String(nextProduct));
    }

    return `/search?${next}`;
  }

  function search(value: string) {
    const next = new URLSearchParams(params);
    const trimmed = value.trim();
    next.delete('product');

    if (trimmed) {
      next.set('keyword', trimmed);
    } else {
      next.delete('keyword');
      next.delete('tab');
    }

    if (next.toString() !== params.toString()) {
      setParams(next);
    }
  }

  return (
    <Page>
      <SearchHeader data-product-detail={isProductDetail || undefined}>
        <AppHeader
          currentPath="/search"
          mobileVariant="search"
          search={
            <HeaderSearch
              key={keyword}
              keyword={keyword}
              onSearch={search}
              onClear={() => search('')}
              backTo={backTo}
              autoFocusMobile
            />
          }
        />
      </SearchHeader>

      <Main>
        {keyword && productId !== null ? (
          <GachaSearchDetail
            key={productId}
            id={productId}
            backTo={storeDetailFrom ?? resultUrl(tab)}
            backLabel={
              storeDetailFrom ? '매장 상세로 돌아가기' : '검색 결과로 돌아가기'
            }
          />
        ) : keyword ? (
          <Results>
            <ResultsTitle>‘{keyword}’ 검색 결과</ResultsTitle>
            <Tabs aria-label="검색 결과 유형">
              {SEARCH_TABS.map(({ id, label }) => (
                <Link
                  key={id}
                  to={resultUrl(id)}
                  aria-current={tab === id ? 'page' : undefined}
                >
                  {label}
                </Link>
              ))}
            </Tabs>
            <Sections key={keyword}>
              {(tab === 'all' || tab === 'trade') && (
                <div>
                  <TradeSearchResults
                    keyword={keyword}
                    preview={tab === 'all'}
                  />
                  {tab === 'all' && (
                    <More to={resultUrl('trade')}>교환글 더보기</More>
                  )}
                </div>
              )}
              {(tab === 'all' || tab === 'gacha') && (
                <div>
                  <GachaResults
                    keyword={keyword}
                    preview={tab === 'all'}
                    onOpen={(id) => resultUrl(tab, id)}
                  />
                  {tab === 'all' && (
                    <More to={resultUrl('gacha')}>가챠 더보기</More>
                  )}
                </div>
              )}
              {(tab === 'all' || tab === 'store') && (
                <div>
                  <StoreResults keyword={keyword} preview={tab === 'all'} />
                  {tab === 'all' && (
                    <More to={resultUrl('store')}>매장 더보기</More>
                  )}
                </div>
              )}
            </Sections>
          </Results>
        ) : (
          <>
            <SearchPrompt>검색어를 입력해주세요</SearchPrompt>
            <DesktopDiscovery>
              <SearchHero />
              <CategoryFeed />
            </DesktopDiscovery>
          </>
        )}
      </Main>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const DesktopDiscovery = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const SearchPrompt = styled.p`
  display: none;

  @media (max-width: 767px) {
    display: grid;
    flex: 1;
    margin: 0;
    padding: 0 16px;
    place-items: center;
    color: #706d71;
    font-size: 14px;
    text-align: center;
  }
`;

const SearchHeader = styled.div`
  display: contents;
  @media (max-width: 767px) {
    &[data-product-detail] {
      display: none;
    }
  }
`;

const Results = styled.div`
  box-sizing: border-box;
  width: min(100%, 1264px);
  margin: 0 auto;
  padding: 32px 32px 64px;

  @media (max-width: 767px) {
    padding: 0 16px 32px;
  }
`;

const ResultsTitle = styled.h1`
  margin: 0 0 16px;
  font-size: 26px;
  overflow-wrap: anywhere;

  @media (max-width: 767px) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
`;

const Tabs = styled.nav`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ececef;

  a {
    display: grid;
    min-height: 44px;
    place-items: center;
    border-bottom: 2px solid transparent;
    color: #706d71;
    text-decoration: none;
    font-size: 14px;
  }

  a[aria-current='page'] {
    border-color: #d73352;
    color: #202126;
    font-weight: 700;
  }
`;

const Sections = styled.div`
  display: grid;
  gap: 32px;

  > div + div {
    padding-top: 24px;
    border-top: 1px solid #ececef;
  }
`;

const More = styled(Link)`
  display: grid;
  width: min(100%, 220px);
  min-height: 44px;
  margin: 20px auto 0;
  place-items: center;
  border: 1px solid #e2dfe0;
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
`;
