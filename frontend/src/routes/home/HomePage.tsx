import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Link, useLocation, useSearchParams } from 'react-router';

import { AppHeader } from '@/shared/ui/AppHeader';

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
          search={
            <KeywordForm key={keyword} keyword={keyword} onSearch={search} />
          }
        />
      </SearchHeader>

      <Main>
        {keyword && productId !== null ? (
          <GachaSearchDetail
            key={productId}
            id={productId}
            backTo={resultUrl(tab)}
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

function KeywordForm({
  keyword,
  onSearch,
}: {
  keyword: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(keyword);
  const location = useLocation();
  const backTo = location.state?.searchFrom === '/map' ? '/map' : '/trade';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!keyword && window.matchMedia?.('(max-width: 767px)').matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [keyword]);

  return (
    <Form
      role="search"
      aria-label="통합 검색"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value);
      }}
    >
      <Back to={backTo} aria-label="검색을 시작한 화면으로 돌아가기">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m15 5-7 7 7 7" />
        </svg>
      </Back>
      <Field>
        <Input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          aria-label="검색어"
          placeholder="교환글, 가챠, 매장 검색"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        {value && (
          <Clear
            type="button"
            aria-label="검색어 지우기"
            onClick={() => {
              setValue('');
              onSearch('');
            }}
          >
            ×
          </Clear>
        )}
        <Submit type="submit" aria-label="검색 실행">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </Submit>
      </Field>
    </Form>
  );
}

const SearchHeader = styled.div`
  @media (max-width: 767px) {
    &[data-product-detail] {
      display: none;
    }

    header > div:has(> [data-header-search-slot]) {
      display: block;
      padding: 8px 12px;
    }

    [data-header-search-slot] {
      display: block;
    }

    header > div > :not([data-header-search-slot]) {
      display: none;
    }
  }
`;

const Form = styled.form`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Back = styled(Link)`
  display: none;

  @media (max-width: 767px) {
    display: grid;
    width: 40px;
    min-height: 44px;
    place-items: center;
    color: inherit;
  }
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  min-height: 44px;
  flex: 1;
  align-items: center;
  padding-inline: 14px 4px;
  border-radius: 999px;
  background: #f5f4f3;
`;

const Input = styled.input`
  min-width: 0;
  flex: 1;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;

  &::-webkit-search-cancel-button {
    display: none;
  }
`;

const Submit = styled.button`
  display: grid;
  width: 40px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
`;

const Clear = styled(Submit)`
  font-size: 20px;
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
