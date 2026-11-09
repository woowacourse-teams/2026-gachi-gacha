import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Link, useSearchParams } from 'react-router';

import {
  TRADE_STATUSES,
  type TradeStatus,
} from '@/domains/trade/tradeSummaryType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  breakpoint,
  color,
  focusRing,
  fontWeight,
  radius,
} from '@/shared/styles/tokens';

import ProductCard from '../../trade/components/ProductCard/ProductCard';
import {
  type MyTradeStatusFilter,
  useMyTradesList,
} from '../trades/useMyTradesList';

/** 웹 시안: 3열 카드를 6개씩 이어서 표시한다. */
const WEB_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 10;

const FILTERS: ReadonlyArray<{ value: MyTradeStatusFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'AVAILABLE', label: '교환 가능' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'COMPLETED', label: '교환 완료' },
];

const EMPTY_COPY: Record<
  MyTradeStatusFilter,
  { title: string; description: string }
> = {
  ALL: {
    title: '아직 작성한 글이 없어요',
    description: '중복 굿즈의 사진과 원하는 교환 조건을 올려 보세요.',
  },
  AVAILABLE: {
    title: '교환 가능한 글이 없어요',
    description: '다른 상태의 글은 전체에서 확인할 수 있어요.',
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

export function getStatusFilter(value: string | null): MyTradeStatusFilter {
  return TRADE_STATUSES.includes(value as TradeStatus)
    ? (value as TradeStatus)
    : 'ALL';
}

function supportsIntersectionObserver(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}

interface MyTradesSectionProps {
  variant: 'web' | 'mobile';
}

export function MyTradesSection({ variant }: MyTradesSectionProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = getStatusFilter(searchParams.get('status'));
  const { state, retry, hasMore, isLoadingMore, loadMoreError, loadMore } =
    useMyTradesList(
      statusFilter,
      variant === 'web' ? WEB_PAGE_SIZE : MOBILE_PAGE_SIZE,
    );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const autoLoads = variant === 'mobile' && supportsIntersectionObserver();
  const emptyCopy = EMPTY_COPY[statusFilter];

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!autoLoads || !sentinel || !hasMore || loadMoreError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [autoLoads, hasMore, loadMore, loadMoreError]);

  function selectFilter(nextFilter: MyTradeStatusFilter) {
    if (nextFilter === statusFilter) {
      return;
    }

    captureAnalyticsEvent('mypage_trade_filter_selected', {
      status: nextFilter,
    });
    setSearchParams(nextFilter === 'ALL' ? {} : { status: nextFilter }, {
      replace: true,
    });
  }

  return (
    <Section data-variant={variant} aria-labelledby="my-trades-heading">
      <Heading id="my-trades-heading" data-variant={variant}>
        내 글
      </Heading>

      <Chips aria-label="내 글 상태 필터" data-variant={variant}>
        {FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            type="button"
            aria-pressed={statusFilter === filter.value}
            onClick={() => selectFilter(filter.value)}
          >
            {filter.label}
          </Chip>
        ))}
      </Chips>

      <Body data-variant={variant} aria-live="polite">
        {state.status !== 'success' && state.status !== 'error' ? (
          <StatePanel role="status">
            <StateTitle>내 글을 불러오고 있어요</StateTitle>
          </StatePanel>
        ) : state.status === 'error' ? (
          <StatePanel role="alert">
            <StateTitle>내 글을 불러오지 못했어요</StateTitle>
            <StateDescription>{state.errorMessage}</StateDescription>
            <StateButton
              type="button"
              onClick={() => {
                captureAnalyticsEvent('recovery_action_selected', {
                  feature: 'mypage_trades',
                });
                retry();
              }}
            >
              다시 시도
            </StateButton>
          </StatePanel>
        ) : state.data.content.length === 0 ? (
          <StatePanel>
            <StateTitle>{emptyCopy.title}</StateTitle>
            <StateDescription>{emptyCopy.description}</StateDescription>
            {statusFilter === 'ALL' ? (
              <StateLink
                to="/trade/new"
                onClick={() =>
                  captureAnalyticsEvent('trade_create_started', {
                    source: 'empty_state',
                  })
                }
              >
                교환글 작성하기
              </StateLink>
            ) : (
              <StateButton type="button" onClick={() => selectFilter('ALL')}>
                전체 글 보기
              </StateButton>
            )}
          </StatePanel>
        ) : (
          <>
            <TradeGrid data-variant={variant}>
              {state.data.content.map((trade, index) => (
                <ProductCard
                  key={trade.tradeId}
                  item={trade}
                  source="mypage"
                  eagerImage={index < 3}
                  homeLayout
                />
              ))}
            </TradeGrid>
            {loadMoreError && (
              <LoadMoreError role="alert">{loadMoreError}</LoadMoreError>
            )}
            {hasMore && autoLoads && !loadMoreError && (
              <Sentinel ref={sentinelRef} aria-hidden="true" />
            )}
            {autoLoads && isLoadingMore && (
              <LoadingMore role="status">불러오는 중...</LoadingMore>
            )}
            {hasMore && (!autoLoads || loadMoreError) && (
              <LoadMoreButton
                type="button"
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
              >
                {isLoadingMore ? '불러오는 중...' : '더보기'}
              </LoadMoreButton>
            )}
          </>
        )}
      </Body>
    </Section>
  );
}

const Section = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 20px;

  &[data-variant='mobile'] {
    gap: 0;
  }
`;

const Heading = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;

  &[data-variant='mobile'] {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &[data-variant='mobile'] {
    height: 48px;
    padding: 0 24px;
    align-items: center;
    flex: 0 0 auto;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Chip = styled.button`
  height: 36px;
  flex: 0 0 auto;
  padding: 0 16px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: ${color.primary};
    background: ${color.primary};
    color: #ffffff;
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const Body = styled.div`
  min-width: 0;

  &[data-variant='mobile'] {
    padding: 0 24px calc(24px + env(safe-area-inset-bottom));
  }
`;

const TradeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px 24px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${breakpoint.mobile}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;

    & > a {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border: 0;
      border-bottom: 1px solid ${color.borderSubtle};
      border-radius: 0;
      box-shadow: none;
    }
  }
`;

const StatePanel = styled.div`
  display: grid;
  min-height: 240px;
  padding: 32px 16px;
  place-content: center;
  justify-items: center;
  gap: 8px;
  text-align: center;
`;

const StateTitle = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: 16px;
  font-weight: ${fontWeight.bold};
`;

const StateDescription = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: 14px;
  line-height: 1.5;
`;

const stateActionStyles = `
  display: inline-flex;
  height: 40px;
  margin-top: 8px;
  padding: 0 16px;
  align-items: center;
  border: 1px solid ${color.border};
  border-radius: 10px;
  background: ${color.surface};
  color: ${color.text};
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
`;

const StateButton = styled.button`
  ${stateActionStyles}
`;

const StateLink = styled(Link)`
  ${stateActionStyles}
`;

const LoadMoreError = styled.p`
  margin: 24px 0 0;
  color: #c51645;
  font-size: 13px;
  text-align: center;
`;

const LoadMoreButton = styled.button`
  display: block;
  width: min(240px, 100%);
  height: 48px;
  margin: 40px auto 0;
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font-size: 15px;
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const Sentinel = styled.div`
  height: 1px;
`;

const LoadingMore = styled.p`
  margin: 16px 0 0;
  color: ${color.textMuted};
  font-size: 13px;
  text-align: center;
`;
