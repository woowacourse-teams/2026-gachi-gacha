import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import type { TradeSummary } from '@/domains/trade/tradeSummaryType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import {
  TradeCopy,
  TradeDeleteButton,
  TradeDetailLink,
  TradeEditLink,
  TradeItem,
  TradeList,
  TradeMeta,
  TradeSide,
  TradeThumbnail,
  TradeTitle,
  TradeViewHint,
} from '../route.styles';

const tradeDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
});

interface MyTradeListProps {
  trades: TradeSummary[];
  onDelete: (trade: TradeSummary) => void;
}

function formatTradeDate(createdAt: string): string {
  const date = new Date(createdAt);

  return Number.isNaN(date.getTime())
    ? '등록일 확인 중'
    : `${tradeDateFormatter.format(date)} 등록`;
}

function getTradeMeta(trade: TradeSummary): string {
  const categoryLabel = trade.categories.join(' · ') || '카테고리 미설정';
  const placeLabel =
    trade.tradePlace?.name || trade.tradePlace?.address || '교환 장소 협의';

  return `${categoryLabel} · ${placeLabel} · ${formatTradeDate(trade.createdAt)}`;
}

export function MyTradeList({ trades, onDelete }: MyTradeListProps) {
  return (
    <TradeList>
      {trades.map((trade) => (
        <TradeItem key={trade.tradeId}>
          <TradeDetailLink
            to={`/trade/${trade.tradeId}`}
            aria-label={`${trade.title} 거래글 보기`}
            onClick={() =>
              captureAnalyticsEvent('trade_selected', {
                trade_id: trade.tradeId,
                status: trade.status,
                source: 'mypage',
              })
            }
          >
            <TradeThumbnail src={trade.thumbnailUrl || gachiGachaLogo} alt="" />
            <TradeCopy>
              <TradeTitle>{trade.title}</TradeTitle>
              <TradeMeta>{getTradeMeta(trade)}</TradeMeta>
              <TradeViewHint aria-hidden="true">거래글 보기 →</TradeViewHint>
            </TradeCopy>
          </TradeDetailLink>
          <TradeSide>
            <TradeStatusBadge status={trade.status} />
            <TradeEditLink
              to={`/trade/${trade.tradeId}/edit`}
              aria-label={`${trade.title} 수정`}
              onClick={() =>
                captureAnalyticsEvent('trade_edit_started', {
                  trade_id: trade.tradeId,
                  source: 'mypage',
                })
              }
            >
              수정
            </TradeEditLink>
            <TradeDeleteButton
              type="button"
              aria-label={`${trade.title} 삭제`}
              onClick={() => {
                captureAnalyticsEvent('trade_delete_started', {
                  trade_id: trade.tradeId,
                  source: 'mypage',
                });
                onDelete(trade);
              }}
            >
              삭제
            </TradeDeleteButton>
          </TradeSide>
        </TradeItem>
      ))}
    </TradeList>
  );
}
