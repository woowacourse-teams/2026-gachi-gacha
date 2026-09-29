import styled from '@emotion/styled';

import { AppHeader } from '@/shared/ui/AppHeader';

import TradeDetail from './components/TradeDetail';
import type { SecondhandDetail } from './model/secondhandDetail';
import ProductCard from '../secondhand/components/ProductCard';
import type { SecondhandItem } from '../secondhand/model/secondhandItem';

interface SecondhandDetailPageProps {
  detail: SecondhandDetail;
  relatedItems?: SecondhandItem[];
  hasMoreRelatedItems?: boolean;
  isLoadingRelatedItems?: boolean;
  onLoadMoreRelatedItems?: () => void;
}

export default function SecondhandDetailPage({
  detail,
  relatedItems = [],
  hasMoreRelatedItems = false,
  isLoadingRelatedItems = false,
  onLoadMoreRelatedItems,
}: SecondhandDetailPageProps) {
  return (
    <Page>
      <AppHeader currentPath="/used-market" />

      <Main>
        <TradeDetail detail={detail} />

        {relatedItems.length > 0 && (
          <RelatedSection>
            <RelatedContent>
              <RelatedHeader>
                <RelatedTitle>다른 중고 물품</RelatedTitle>
              </RelatedHeader>

              <ProductGrid>
                {relatedItems.map((item) => (
                  <ProductCard key={item.tradeId} item={item} />
                ))}
              </ProductGrid>

              {hasMoreRelatedItems && (
                <MoreButton
                  type="button"
                  disabled={isLoadingRelatedItems}
                  onClick={onLoadMoreRelatedItems}
                >
                  {isLoadingRelatedItems ? '불러오는 중...' : '더보기'}
                </MoreButton>
              )}
            </RelatedContent>
          </RelatedSection>
        )}
      </Main>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: #ffffff;
`;

const Main = styled.main`
  box-sizing: border-box;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 36px 32px 80px;

  @media (max-width: 680px) {
    padding: 24px 16px 56px;
  }
`;

const RelatedSection = styled.section`
  padding-top: 48px;
  border-top: 1px solid #e9e9ec;
`;

const RelatedContent = styled.div`
  width: 100%;
`;

const RelatedHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const RelatedTitle = styled.h2`
  margin: 0;
  color: #25262b;
  font-size: 24px;
  letter-spacing: -0.03em;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 205px));
  justify-content: start;
  gap: 40px 24px;

  @media (max-width: 1184px) {
    grid-template-columns: repeat(4, minmax(0, 205px));
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 205px));
  }

  @media (max-width: 620px) {
    grid-template-columns: repeat(2, minmax(0, 205px));
    gap: 30px 14px;
  }
`;

const MoreButton = styled.button`
  display: block;
  min-width: 160px;
  margin: 40px auto 0;
  padding: 13px 28px;
  border: 1px solid #d9d9df;
  border-radius: 10px;
  background: #ffffff;
  color: #45464d;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: #ed174c;
    color: #ed174c;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;
