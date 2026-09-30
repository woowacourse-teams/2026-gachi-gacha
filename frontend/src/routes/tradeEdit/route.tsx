import styled from '@emotion/styled';

import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import TradeEditPage from './TradeEditPage';
import { useTradeEditCategories } from './useTradeEditCategories';
import { useTradeDetail } from '../tradeDetail/useTradeDetail';

export interface TradeEditRouteProps {
  tradeId: number;
}

function matchSelectedCategories(
  categoryNames: string[],
  categories: TradeCategory[],
): TradeCategory[] | null {
  const selectedCategories = categoryNames.flatMap((categoryName) => {
    const category = categories.find(({ name }) => name === categoryName);

    return category ? [category] : [];
  });

  return selectedCategories.length === categoryNames.length
    ? selectedCategories
    : null;
}

export function TradeEditRoute({ tradeId }: TradeEditRouteProps) {
  const { memberId } = useAuthSession();
  const { state: detailState, retry: retryDetail } = useTradeDetail(tradeId);
  const { state: categoryState, retry: retryCategories } =
    useTradeEditCategories();

  if (
    detailState.status === 'loading' ||
    detailState.status === 'idle' ||
    categoryState.status === 'loading' ||
    categoryState.status === 'idle'
  ) {
    return <PageLoadingFallback label="수정할 교환 글을 불러오고 있어요." />;
  }

  if (detailState.status === 'error' || categoryState.status === 'error') {
    const errorMessage =
      detailState.status === 'error'
        ? detailState.errorMessage
        : categoryState.status === 'error'
          ? categoryState.errorMessage
          : '수정할 교환 글을 불러오지 못했습니다.';

    return (
      <MessagePage
        title="수정할 교환 글을 불러오지 못했어요"
        description={errorMessage}
        actionLabel="다시 시도"
        onAction={() => {
          retryDetail();
          retryCategories();
        }}
      />
    );
  }

  if (memberId === null || memberId !== String(detailState.data.memberId)) {
    return (
      <MessagePage
        title="게시글을 수정할 수 없어요"
        description="작성자만 교환 게시글을 수정할 수 있습니다."
        href={`/trade/${tradeId}`}
        actionLabel="게시글로 돌아가기"
      />
    );
  }

  const selectedCategories = matchSelectedCategories(
    detailState.data.categories,
    categoryState.data,
  );

  if (!selectedCategories) {
    return (
      <MessagePage
        title="카테고리 정보를 불러오지 못했어요"
        description="게시글의 기존 카테고리를 확인할 수 없습니다."
        actionLabel="다시 시도"
        onAction={retryCategories}
      />
    );
  }

  return (
    <TradeEditPage detail={detailState.data} categories={selectedCategories} />
  );
}

interface MessagePageProps {
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}

function MessagePage({
  title,
  description,
  actionLabel,
  href,
  onAction,
}: MessagePageProps) {
  return (
    <Page>
      <AppHeader currentPath="/trade" />
      <Message role="alert">
        <MessageTitle>{title}</MessageTitle>
        <MessageDescription>{description}</MessageDescription>
        {href ? (
          <ActionLink href={href}>{actionLabel}</ActionLink>
        ) : (
          <ActionButton type="button" onClick={onAction}>
            {actionLabel}
          </ActionButton>
        )}
      </Message>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: #ffffff;
`;

const Message = styled.main`
  display: flex;
  min-height: 60dvh;
  padding: 32px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;

const MessageTitle = styled.h1`
  margin: 0;
  color: #202126;
  font-size: 28px;
`;

const MessageDescription = styled.p`
  margin: 12px 0 0;
  color: #73757e;
`;

const actionStyle = `
  margin-top: 24px;
  padding: 12px 20px;
  border: 1px solid #ed174c;
  border-radius: 10px;
  background: #ed174c;
  color: #ffffff;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
`;

const ActionLink = styled.a`
  ${actionStyle}
`;

const ActionButton = styled.button`
  ${actionStyle}
`;
