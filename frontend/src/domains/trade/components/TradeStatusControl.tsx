import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import { updateTradeStatus } from '../api/updateTradeStatus';
import { getTradeStatusPresentation } from '../tradeStatusPresentation';
import { TRADE_STATUSES, type TradeStatus } from '../tradeSummaryType';

export interface TradeStatusControlProps {
  tradeId: number;
  status: TradeStatus;
  contextLabel?: string;
  onStatusChanged: (status: TradeStatus) => void;
}

export function TradeStatusControl({
  tradeId,
  status,
  contextLabel,
  onStatusChanged,
}: TradeStatusControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  async function handleChange(nextStatus: TradeStatus) {
    setIsOpen(false);
    triggerRef.current?.focus();

    if (isUpdating || nextStatus === status) return;

    setSelectedStatus(nextStatus);
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const updatedTrade = await updateTradeStatus({
        tradeId,
        status: nextStatus,
      });

      captureAnalyticsEvent('trade_status_update_completed', {
        trade_id: tradeId,
        previous_status: status,
        next_status: updatedTrade.status,
        outcome: 'success',
      });
      onStatusChanged(updatedTrade.status);
    } catch (error: unknown) {
      captureAnalyticsEvent('trade_status_update_completed', {
        trade_id: tradeId,
        previous_status: status,
        next_status: nextStatus,
        outcome: 'failure',
      });
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
    <Container ref={containerRef}>
      <StatusButton
        ref={triggerRef}
        type="button"
        $status={selectedStatus}
        disabled={isUpdating}
        aria-label={`${contextLabel ? `${contextLabel} ` : ''}교환 상태: ${getTradeStatusPresentation(selectedStatus).label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={`trade-status-menu-${tradeId}`}
        aria-busy={isUpdating}
        onClick={() => {
          setErrorMessage(null);
          setIsOpen((current) => !current);
        }}
      >
        <StatusDot $status={selectedStatus} />
        {isUpdating
          ? '변경 중'
          : getTradeStatusPresentation(selectedStatus).label}
        {isUpdating ? (
          <Spinner aria-hidden="true" />
        ) : (
          <Chevron aria-hidden="true" />
        )}
      </StatusButton>

      {isOpen && (
        <StatusMenu id={`trade-status-menu-${tradeId}`} role="menu">
          <MenuHeading>교환 상태 변경</MenuHeading>
          {TRADE_STATUSES.map((statusOption) => {
            const isSelected = statusOption === selectedStatus;

            return (
              <StatusOption
                key={statusOption}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                $selected={isSelected}
                onClick={() => void handleChange(statusOption)}
              >
                <StatusDot $status={statusOption} />
                <OptionLabel>
                  {getTradeStatusPresentation(statusOption).label}
                </OptionLabel>
                {isSelected && <Check aria-hidden="true">✓</Check>}
              </StatusOption>
            );
          })}
        </StatusMenu>
      )}

      {errorMessage && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const StatusButton = styled.button<{ $status: TradeStatus }>`
  display: inline-flex;
  min-height: 32px;
  padding: 6px 10px;
  align-items: center;
  gap: 7px;
  border: 1px solid
    ${({ $status }) => getTradeStatusPresentation($status).border};
  border-radius: 999px;
  background: ${({ $status }) =>
    getTradeStatusPresentation($status).background};
  color: ${({ $status }) => getTradeStatusPresentation($status).text};
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(0.98);
  }

  &:disabled {
    cursor: wait;
  }

  &:focus-visible {
    outline: 2px solid #ed174c;
    outline-offset: 2px;
  }
`;

const StatusDot = styled.span<{ $status: TradeStatus }>`
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: ${({ $status }) => getTradeStatusPresentation($status).text};
`;

const Chevron = styled.span`
  width: 6px;
  height: 6px;
  margin: -3px 1px 1px 2px;
  transform: rotate(45deg);
  border-right: 1.5px solid currentcolor;
  border-bottom: 1.5px solid currentcolor;
`;

const Spinner = styled.span`
  width: 10px;
  height: 10px;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const StatusMenu = styled.div`
  position: absolute;
  z-index: 10;
  top: calc(100% + 8px);
  left: 0;
  display: grid;
  box-sizing: border-box;
  width: 196px;
  padding: 7px;
  border: 1px solid #e6e4e5;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgb(35 29 31 / 14%);
`;

const MenuHeading = styled.p`
  margin: 3px 8px 7px;
  color: #92939a;
  font-size: 11px;
  font-weight: 700;
`;

const StatusOption = styled.button<{ $selected: boolean }>`
  display: grid;
  min-height: 42px;
  padding: 0 10px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  border: 0;
  border-radius: 9px;
  background: ${({ $selected }) => ($selected ? '#fff5f7' : '#ffffff')};
  color: #34353a;
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f7f6f7;
  }

  &:focus-visible {
    outline: 2px solid #ed174c;
    outline-offset: -2px;
  }
`;

const OptionLabel = styled.span`
  font-weight: 700;
`;

const Check = styled.span`
  color: #ed174c;
  font-size: 15px;
  font-weight: 900;
`;

const ErrorMessage = styled.p`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: max-content;
  max-width: min(320px, 80vw);
  margin: 0;
  color: #d80f42;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
`;
