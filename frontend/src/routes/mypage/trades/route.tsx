import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { TradeDeleteDialog } from '@/domains/trade/components/TradeDeleteDialog';
import {
  TRADE_STATUSES,
  type TradeStatus,
  type TradeSummary,
} from '@/domains/trade/tradeSummaryType';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { assignBrowserLocation } from '@/shared/browser/browserNavigation';
import { AppHeader } from '@/shared/ui/AppHeader';

import {
  BackLink,
  CreateLink,
  Description,
  FilterButton,
  FilterList,
  FilterNav,
  Header,
  Heading,
  ListCard,
  LoadMoreButton,
  LoadMoreError,
  Main,
  Page,
  PaginationArea,
  RetryButton,
  StateDescription,
  StatePanel,
  StateTitle,
  TotalCount,
} from './route.styles';
import { type MyTradeStatusFilter, useMyTradesList } from './useMyTradesList';
import { MyTradeList } from '../components/MyTradeList';

const FILTERS: ReadonlyArray<{
  value: MyTradeStatusFilter;
  label: string;
}> = [
  { value: 'ALL', label: '전체' },
  { value: 'AVAILABLE', label: '교환 가능' },
  { value: 'IN_PROGRESS', label: '교환 진행 중' },
  { value: 'COMPLETED', label: '교환 완료' },
];

const EMPTY_COPY: Record<
  MyTradeStatusFilter,
  { title: string; description: string }
> = {
  ALL: {
    title: '아직 작성한 교환글이 없어요',
    description: '중복 굿즈의 사진과 원하는 교환 조건을 올려 보세요.',
  },
  AVAILABLE: {
    title: '교환 가능한 글이 없어요',
    description: '다른 상태의 교환글은 전체 탭에서 확인할 수 있어요.',
  },
  IN_PROGRESS: {
    title: '진행 중인 교환이 없어요',
    description: '교환을 진행하면 이곳에서 한눈에 확인할 수 있어요.',
  },
  COMPLETED: {
    title: '완료한 교환이 없어요',
    description: '교환이 완료된 글은 이곳에 차곡차곡 모여요.',
  },
};

function getStatusFilter(value: string | null): MyTradeStatusFilter {
  return TRADE_STATUSES.includes(value as TradeStatus)
    ? (value as TradeStatus)
    : 'ALL';
}

function openGachaSearchResults(gachaId: number) {
  assignBrowserLocation(createGachaSearchResultsUrl(gachaId));
}

export function MyTradesRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = getStatusFilter(searchParams.get('status'));
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useMyTradesList(statusFilter);
  const [deleteTarget, setDeleteTarget] = useState<TradeSummary | null>(null);
  const emptyCopy = EMPTY_COPY[statusFilter];
  const totalCount =
    state.status === 'success' ? state.data.totalElements : null;

  function selectFilter(nextFilter: MyTradeStatusFilter) {
    captureAnalyticsEvent('mypage_trade_filter_selected', {
      status: nextFilter,
    });

    if (nextFilter === 'ALL') {
      setSearchParams({}, { replace: true });
      return;
    }

    setSearchParams({ status: nextFilter }, { replace: true });
  }

  return (
    <Page>
      <AppHeader
        currentPath="/mypage"
        search={<GachaSearchBar onSelect={openGachaSearchResults} />}
      />

      <Main>
        <BackLink to="/mypage">← 마이페이지</BackLink>
        <Header>
          <div>
            <Heading>내 교환글</Heading>
            <Description>
              내가 올린 글의 상태를 확인하고 수정하거나 관리해요.
            </Description>
          </div>
          {totalCount !== null && <TotalCount>총 {totalCount}개</TotalCount>}
        </Header>

        <FilterNav aria-label="내 교환글 상태 필터">
          <FilterList>
            {FILTERS.map((filter) => (
              <FilterButton
                key={filter.value}
                type="button"
                $selected={statusFilter === filter.value}
                aria-pressed={statusFilter === filter.value}
                onClick={() => selectFilter(filter.value)}
              >
                {filter.label}
              </FilterButton>
            ))}
          </FilterList>
        </FilterNav>

        <ListCard aria-live="polite">
          {state.status !== 'success' && state.status !== 'error' ? (
            <StatePanel role="status">
              <StateTitle>내 교환글을 불러오고 있어요</StateTitle>
            </StatePanel>
          ) : state.status === 'error' ? (
            <StatePanel role="alert">
              <StateTitle>내 교환글을 불러오지 못했어요</StateTitle>
              <StateDescription>{state.errorMessage}</StateDescription>
              <RetryButton
                type="button"
                onClick={() => {
                  captureAnalyticsEvent('recovery_action_selected', {
                    feature: 'mypage_trades',
                  });
                  retry();
                }}
              >
                다시 시도
              </RetryButton>
            </StatePanel>
          ) : state.data.content.length === 0 ? (
            <StatePanel>
              <StateTitle>{emptyCopy.title}</StateTitle>
              <StateDescription>{emptyCopy.description}</StateDescription>
              {statusFilter === 'ALL' ? (
                <CreateLink
                  to="/trade/new"
                  onClick={() =>
                    captureAnalyticsEvent('trade_create_started', {
                      source: 'empty_state',
                    })
                  }
                >
                  교환글 작성하기
                </CreateLink>
              ) : (
                <RetryButton type="button" onClick={() => selectFilter('ALL')}>
                  전체 글 보기
                </RetryButton>
              )}
            </StatePanel>
          ) : (
            <>
              <MyTradeList
                trades={state.data.content}
                onDelete={setDeleteTarget}
              />
              {(hasMore || loadMoreError) && (
                <PaginationArea>
                  {loadMoreError && (
                    <LoadMoreError role="alert">{loadMoreError}</LoadMoreError>
                  )}
                  <LoadMoreButton
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => void loadMore()}
                  >
                    {isLoadingMore ? '불러오는 중...' : '교환글 더보기'}
                  </LoadMoreButton>
                </PaginationArea>
              )}
            </>
          )}
        </ListCard>
      </Main>

      {deleteTarget && (
        <TradeDeleteDialog
          open
          tradeId={deleteTarget.tradeId}
          tradeTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            retry();
          }}
        />
      )}
    </Page>
  );
}
