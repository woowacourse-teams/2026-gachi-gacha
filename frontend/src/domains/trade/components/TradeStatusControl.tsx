import { useEffect, useState } from 'react';
import styled from '@emotion/styled';

import { updateTradeStatus } from '../api/updateTradeStatus';
import type { TradeStatus } from '../tradeSummaryType';

const STATUS_OPTIONS: { value: TradeStatus; label: string }[] = [
  { value: 'AVAILABLE', label: '교환 가능' },
  { value: 'IN_PROGRESS', label: '교환 진행 중' },
  { value: 'COMPLETED', label: '교환 완료' },
];

export interface TradeStatusControlProps {
  tradeId: number;
  status: TradeStatus;
  onStatusChanged: (status: TradeStatus) => void;
}

export function TradeStatusControl({
  tradeId,
  status,
  onStatusChanged,
}: TradeStatusControlProps) {
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  async function handleChange(nextStatus: TradeStatus) {
    if (isUpdating || nextStatus === status) {
      return;
    }

    setSelectedStatus(nextStatus);
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const updatedTrade = await updateTradeStatus({
        tradeId,
        status: nextStatus,
      });

      onStatusChanged(updatedTrade.status);
    } catch (error: unknown) {
      setSelectedStatus(status);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '교환 상태를 변경하지 못했습니다.',
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <ControlGroup>
      <Label htmlFor={`trade-status-${tradeId}`}>교환 상태</Label>
      <Select
        id={`trade-status-${tradeId}`}
        value={selectedStatus}
        disabled={isUpdating}
        aria-busy={isUpdating}
        onChange={(event) =>
          void handleChange(event.target.value as TradeStatus)
        }
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {isUpdating && <StatusMessage role="status">변경 중...</StatusMessage>}
      {errorMessage && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
    </ControlGroup>
  );
}

const ControlGroup = styled.div`
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 12px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  color: #888a93;
  font-size: 14px;
`;

const Select = styled.select`
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #d9d9df;
  border-radius: 10px;
  background: #ffffff;
  color: #292a2f;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 2px solid #ed174c;
    outline-offset: 2px;
  }
`;

const StatusMessage = styled.p`
  grid-column: 2;
  margin: 0;
  color: #696b73;
  font-size: 13px;

  @media (max-width: 520px) {
    grid-column: 1;
  }
`;

const ErrorMessage = styled(StatusMessage)`
  color: #d80f42;
`;
