import styled from '@emotion/styled';

import { getTradeStatusPresentation } from '../tradeStatusPresentation';
import type { TradeStatus } from '../tradeSummaryType';

export interface TradeStatusBadgeProps {
  status: TradeStatus;
}

export function TradeStatusBadge({ status }: TradeStatusBadgeProps) {
  return (
    <Badge $status={status}>
      <StatusDot $status={status} aria-hidden="true" />
      {getTradeStatusPresentation(status).label}
    </Badge>
  );
}

const Badge = styled.span<{ $status: TradeStatus }>`
  display: inline-flex;
  min-height: 28px;
  padding: 5px 9px;
  align-items: center;
  gap: 6px;
  border: 1px solid
    ${({ $status }) => getTradeStatusPresentation($status).border};
  border-radius: 999px;
  background: ${({ $status }) =>
    getTradeStatusPresentation($status).background};
  color: ${({ $status }) => getTradeStatusPresentation($status).text};
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
`;

const StatusDot = styled.span<{ $status: TradeStatus }>`
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: ${({ $status }) => getTradeStatusPresentation($status).text};
`;
