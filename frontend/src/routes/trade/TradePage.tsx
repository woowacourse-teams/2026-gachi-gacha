import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';

import ProductCard from './components/ProductCard';
import SearchHero from './components/SearchHero';
import type { TradeItem } from './model/tradeItem';

interface TradePageProps {
  items: TradeItem[];
  query?: string;
  status?: 'loading' | 'success' | 'error';
  errorMessage?: string | null;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreError?: string | null;
  onSearch?: (query: string) => void;
  onRetry?: () => void;
  onLoadMore?: () => void;
}

export default function TradePage({
  items,
  query = '',
  status = 'success',
  errorMessage = null,
  hasMore = false,
  isLoadingMore = false,
  loadMoreError = null,
  onSearch = () => undefined,
  onRetry,
  onLoadMore,
}: TradePageProps) {
  return (
    <Page>
      <AppHeader currentPath="/trade" />

      <Main>
        <SearchHero
          title="어떤 가챠를 교환해볼까요?"
          initialQuery={query}
          onSearch={onSearch}
        />

        <ResultsPanel aria-live="polite">
          <ResultsTitle>
            {query ? `‘${query}’ 검색결과` : '최신순'}
          </ResultsTitle>

          {status === 'loading' ? (
            <LoadingStateMessage role="status">
              교환 게시글을 불러오는 중...
            </LoadingStateMessage>
          ) : status === 'error' ? (
            <StateBox role="alert">
              <StateMessage>
                {errorMessage || '교환 게시글을 불러오지 못했습니다.'}
              </StateMessage>
              {onRetry && (
                <RetryButton type="button" onClick={onRetry}>
                  다시 시도
                </RetryButton>
              )}
            </StateBox>
          ) : items.length > 0 ? (
            <>
              <ProductGrid>
                {items.map((item) => (
                  <ProductCard key={item.tradeId} item={item} />
                ))}
              </ProductGrid>
              {loadMoreError && (
                <LoadMoreError role="alert">{loadMoreError}</LoadMoreError>
              )}
              {hasMore && onLoadMore && (
                <LoadMoreButton
                  type="button"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                >
                  {isLoadingMore ? '불러오는 중...' : '더보기'}
                </LoadMoreButton>
              )}
            </>
          ) : (
            <EmptyState>
              {query
                ? '검색어와 일치하는 게시글이 없어요.'
                : '아직 등록된 교환 게시글이 없어요.'}
            </EmptyState>
          )}
        </ResultsPanel>
      </Main>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: ${color.surface};
`;

const Main = styled.main`
  display: flex;
  box-sizing: border-box;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 40px 48px 72px;
  flex-direction: column;
  gap: ${space.xxl};

  @media (max-width: ${breakpoint.mobile}) {
    padding: 28px 16px 48px;
    gap: ${space.xl};
  }
`;

const ResultsPanel = styled.section`
  width: 100%;
  max-width: 1121px;
  margin: 0 auto;
  padding: ${space.xxl} 0;
  background: ${color.surface};

  @media (max-width: 1216px) {
    max-width: 892px;
  }

  @media (max-width: ${breakpoint.wide}) {
    max-width: 663px;
  }

  @media (max-width: ${breakpoint.mobile}) {
    max-width: 424px;
    padding: ${space.md} 0;
  }
`;

const ResultsTitle = styled.h2`
  margin: 0 0 ${space.xl};
  color: ${color.text};
  font-size: 28px;
  font-weight: ${fontWeight.bold};
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 205px));
  justify-content: center;
  gap: 44px 24px;

  @media (max-width: 1216px) {
    grid-template-columns: repeat(4, minmax(0, 205px));
  }

  @media (max-width: ${breakpoint.wide}) {
    grid-template-columns: repeat(3, minmax(0, 205px));
  }

  @media (max-width: ${breakpoint.mobile}) {
    grid-template-columns: repeat(2, minmax(0, 205px));
    gap: 32px 14px;
  }
`;

const EmptyState = styled.p`
  margin: 0;
  padding: ${space.huge} ${space.md};
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  text-align: center;
`;

const StateBox = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: ${space.md};
  padding: ${space.huge} ${space.md};
`;

const StateMessage = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  text-align: center;
`;

const LoadingStateMessage = styled(StateMessage)`
  padding: ${space.huge} ${space.md};
`;

const RetryButton = styled.button`
  padding: ${space.sm} ${space.lg};
  border: 0;
  border-radius: ${radius.control};
  background: ${color.primary};
  color: ${color.surface};
  font-weight: ${fontWeight.bold};
  cursor: pointer;
`;

const LoadMoreError = styled(StateMessage)`
  margin-top: ${space.xl};
  color: ${color.primary};
`;

const LoadMoreButton = styled.button`
  display: block;
  min-width: 160px;
  min-height: 48px;
  margin: ${space.xxl} auto 0;
  padding: 0 ${space.xl};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;
