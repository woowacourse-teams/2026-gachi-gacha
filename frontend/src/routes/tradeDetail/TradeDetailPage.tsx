import styled from '@emotion/styled';
import { Link, useLocation, useNavigate } from 'react-router';

import type { TradeDetail as TradeDetailData } from '@/domains/trade/tradeDetailType';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { AffiliateCatalogSlot } from '@/features/affiliateCatalog/AffiliateCatalogSlot';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { AppHeader } from '@/shared/ui/AppHeader';

import { TradeComments } from './components/TradeComments';
import TradeDetail from './components/TradeDetail';
import type {
  TradeComment,
  TradeCommentAction,
  TradeCommentAuthor,
  TradeCommentSubmission,
} from './model/tradeComment';
import ProductCard from '../trade/components/ProductCard';
import type { TradeItem } from '../trade/model/tradeItem';

// login: 비로그인 사용자의 채팅하기. 로그인 후 채팅이 아닌 상세 페이지로 돌아온다.
export type TradeDetailAction = 'chat' | 'login' | 'edit' | null;

interface TradeDetailPageProps {
  detail: TradeDetailData;
  action?: TradeDetailAction;
  onChangeStatus?: ((status: TradeStatus) => Promise<void>) | undefined;
  hasSubmittedComment?: boolean;
  relatedItems?: TradeItem[];
  hasMoreRelatedItems?: boolean;
  isLoadingRelatedItems?: boolean;
  onLoadMoreRelatedItems?: () => void;
  comments?: TradeComment[];
  commentsStatus?: 'loading' | 'success' | 'error';
  commentsErrorMessage?: string | null;
  commentViewer?: TradeCommentAuthor | null;
  onSubmitComment?:
    ((submission: TradeCommentSubmission) => Promise<void> | void) | undefined;
  onRetryComments?: (() => void) | undefined;
  onCommentAction?:
    ((action: TradeCommentAction, comment: TradeComment) => void) | undefined;
  showSafetyActions?: boolean;
  onTradeAuthorBlocked?: () => void;
}

export default function TradeDetailPage({
  detail,
  action = 'chat',
  onChangeStatus,
  hasSubmittedComment = false,
  relatedItems = [],
  hasMoreRelatedItems = false,
  isLoadingRelatedItems = false,
  onLoadMoreRelatedItems,
  comments = [],
  commentsStatus = 'success',
  commentsErrorMessage = null,
  commentViewer = null,
  onSubmitComment,
  onRetryComments,
  onCommentAction,
  showSafetyActions = false,
  onTradeAuthorBlocked,
}: TradeDetailPageProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Page data-owner={action === 'edit' || undefined}>
      <DesktopHeader>
        <AppHeader currentPath="/trade" />
      </DesktopHeader>
      <MobileHeader>
        <BackLink
          to="/trade"
          aria-label="목록으로 돌아가기"
          onClick={(event) => {
            if (
              location.state?.fromTradeList &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.altKey &&
              !event.shiftKey
            ) {
              event.preventDefault();
              void navigate(-1);
            }
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m14 5-7 7 7 7" />
          </svg>
        </BackLink>
      </MobileHeader>

      <Main>
        <TradeDetail
          key={detail.tradeId}
          detail={detail}
          onChangeStatus={onChangeStatus}
          action={action}
          owner={action === 'edit' ? commentViewer : null}
          commentCount={commentsStatus === 'success' ? comments.length : null}
          hasSubmittedComment={hasSubmittedComment}
          showSafetyActions={showSafetyActions && action === 'chat'}
          onAuthorBlocked={onTradeAuthorBlocked}
          comments={
            <TradeComments
              comments={comments}
              commentsStatus={commentsStatus}
              commentsErrorMessage={commentsErrorMessage}
              viewer={commentViewer}
              onSubmit={onSubmitComment}
              onRetryComments={onRetryComments}
              onCommentAction={onCommentAction}
              showSafetyActions={showSafetyActions}
            />
          }
        />

        <AffiliateCatalogSlot
          matchBy="content"
          categoryNames={detail.categories}
          title={detail.title}
          placementPath="/trade"
        />

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
                    homeLayout
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
  width: min(100%, 1264px);
  margin: 0 auto;
  padding: 32px 32px 64px;

  @media (max-width: 767px) {
    padding: 0 0 calc(88px + env(safe-area-inset-bottom));
  }
`;

const RelatedSection = styled.section`
  padding-top: 48px;
  border-top: 1px solid #e9e9ec;

  @media (min-width: 901px) {
    [data-owner] & {
      padding-top: 0;
      border-top: 0;
    }
  }

  @media (max-width: 767px) {
    padding: 20px 0 0;
    border-top: 8px solid #f5f4f3;
  }
`;

const RelatedContent = styled.div`
  width: 100%;
`;

const RelatedHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 767px) {
    margin: 0 24px 14px;
  }
`;

const RelatedTitle = styled.h2`
  margin: 0;
  color: #25262b;
  font-size: 24px;
  letter-spacing: -0.03em;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-content: start;
  gap: 40px 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 205px));
  }

  @media (max-width: 767px) {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: 132px;
    overflow-x: auto;
    padding: 0 24px 8px;
    gap: 10px;
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

const DesktopHeader = styled.div`
  display: contents;

  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileHeader = styled.header`
  display: none;

  @media (max-width: 767px) {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    min-height: 48px;
    padding: 0 8px;
    align-items: center;
    background: white;
  }
`;

const BackLink = styled(Link)`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: inherit;
`;
