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
import type { SecondhandItem } from './model/secondhandItem';

interface SecondhandPageProps {
  items: SecondhandItem[];
  query?: string;
  status?: 'loading' | 'success' | 'error';
  errorMessage?: string | null;
  onSearch?: (query: string) => void;
  onRetry?: () => void;
}

export default function SecondhandPage({
  items,
  query = '',
  status = 'success',
  errorMessage = null,
  onSearch = () => undefined,
  onRetry,
}: SecondhandPageProps) {
  return (
    <Page>
      <AppHeader currentPath="/used-market" />

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
            <ProductGrid>
              {items.map((item) => (
                <ProductCard key={item.tradeId} item={item} />
              ))}
            </ProductGrid>
          ) : (
            <EmptyState>
              {query
                ? '검색어와 일치하는 게시글이 없어요.'
                : '아직 등록된 중고거래 게시글이 없어요.'}
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
