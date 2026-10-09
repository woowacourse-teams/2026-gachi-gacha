import styled from '@emotion/styled';

import type { TradeDetail as TradeDetailData } from '@/domains/trade/tradeDetailType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { AppHeader } from '@/shared/ui/AppHeader';

import TradeDetail from './components/TradeDetail';
import ProductCard from '../trade/components/ProductCard';
import type { TradeItem } from '../trade/model/tradeItem';

// login: 비로그인 사용자의 채팅하기. 로그인 후 채팅이 아닌 상세 페이지로 돌아온다.
export type TradeDetailAction = 'chat' | 'login' | 'edit' | null;

interface TradeDetailPageProps {
  detail: TradeDetailData;
  action?: TradeDetailAction;
  relatedItems?: TradeItem[];
  hasMoreRelatedItems?: boolean;
  isLoadingRelatedItems?: boolean;
  onLoadMoreRelatedItems?: () => void;
}

export default function TradeDetailPage({
  detail,
  action = 'chat',
  relatedItems = [],
  hasMoreRelatedItems = false,
  isLoadingRelatedItems = false,
  onLoadMoreRelatedItems,
}: TradeDetailPageProps) {
  return (
    <Page>
      <AppHeader currentPath="/trade" />

      <Main>
        <TradeDetail detail={detail} action={action} />

        {relatedItems.length > 0 && (
          <RelatedSection>
            <RelatedContent>
              <RelatedHeader>
                <RelatedTitle>다른 교환 물품</RelatedTitle>
              </RelatedHeader>

              <ProductGrid>
                {relatedItems.map((item) => (
                  <ProductCard
                    key={item.tradeId}
                    item={item}
                    source="related_list"
                  />
                ))}
              </ProductGrid>

              {hasMoreRelatedItems && (
                <MoreButton
                  type="button"
                  disabled={isLoadingRelatedItems}
                  onClick={() => {
                    captureAnalyticsEvent('trade_list_more_requested', {
                      query_applied: false,
                      loaded_item_count: relatedItems.length,
                      source: 'related_list',
                    });
                    onLoadMoreRelatedItems?.();
                  }}
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
