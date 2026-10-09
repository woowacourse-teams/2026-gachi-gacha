import styled from '@emotion/styled';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import TradeDetailPage from './TradeDetailPage';
import { useRelatedTrades } from './useRelatedTrades';
import { useTradeDetail } from './useTradeDetail';

export interface TradeDetailRouteProps {
  tradeId: number;
}

export function TradeDetailRoute({ tradeId }: TradeDetailRouteProps) {
  const { status: authStatus, memberId } = useAuthSession();
  const { state, retry } = useTradeDetail(tradeId);
  const {
    items: relatedItems,
    hasMore: hasMoreRelatedItems,
    isLoading: isLoadingRelatedItems,
    loadMore: loadMoreRelatedItems,
  } = useRelatedTrades(tradeId);

  if (state.status === 'loading' || state.status === 'idle') {
    return <PageLoadingFallback label="교환 게시글을 불러오고 있어요." />;
  }

  if (state.status === 'error') {
    return (
      <Page>
        <AppHeader currentPath="/trade" />
        <ErrorPanel role="alert">
          <ErrorTitle>교환 게시글을 보여드리지 못했어요</ErrorTitle>
          <ErrorDescription>{state.errorMessage}</ErrorDescription>
          <ErrorActions>
            <RetryButton
              type="button"
              onClick={() => {
                captureAnalyticsEvent('recovery_action_selected', {
                  feature: 'trade_detail',
                });
                retry();
              }}
            >
              다시 시도
            </RetryButton>
            <BackLink href="/trade">목록으로 돌아가기</BackLink>
          </ErrorActions>
        </ErrorPanel>
      </Page>
    );
  }

  const action =
    authStatus === 'loading'
      ? null
      : authStatus !== 'authenticated'
        ? 'login'
        : memberId !== null && memberId === String(state.data.memberId)
          ? 'edit'
          : 'chat';

  return (
    <TradeDetailPage
      detail={state.data}
      action={action}
      relatedItems={relatedItems}
      hasMoreRelatedItems={hasMoreRelatedItems}
      isLoadingRelatedItems={isLoadingRelatedItems}
      onLoadMoreRelatedItems={loadMoreRelatedItems}
    />
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: ${color.surface};
`;

const ErrorPanel = styled.main`
  display: flex;
  min-height: 60dvh;
  padding: ${space.xxl};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;

const ErrorTitle = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.pageTitle};
`;

const ErrorDescription = styled.p`
  margin: ${space.md} 0 0;
  color: ${color.textMuted};
`;

const ErrorActions = styled.div`
  display: flex;
  gap: ${space.sm};
  margin-top: ${space.xl};
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

const BackLink = styled.a`
  padding: ${space.sm} ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  color: ${color.text};
  font-weight: ${fontWeight.bold};
  text-decoration: none;
`;
