import { useEffect, useState } from 'react';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { deleteTrade } from '../api/deleteTrade';

export interface TradeDeleteDialogProps {
  open: boolean;
  tradeId: number;
  tradeTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function TradeDeleteDialog({
  open,
  tradeId,
  tradeTitle,
  onClose,
  onDeleted,
}: TradeDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMessage(null);
    }
  }, [open]);

  async function handleConfirm() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteTrade(tradeId);
      captureAnalyticsEvent('trade_delete_completed', {
        trade_id: tradeId,
        outcome: 'success',
      });
      setIsDeleting(false);
      onDeleted();
    } catch (error: unknown) {
      captureAnalyticsEvent('trade_delete_completed', {
        trade_id: tradeId,
        outcome: 'failure',
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '교환 게시글을 삭제하지 못했습니다.',
      );
      setIsDeleting(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="교환 글을 삭제할까요?"
      description={`'${tradeTitle}' 글을 삭제하면 되돌릴 수 없어요.`}
      confirmLabel="삭제"
      pendingLabel="삭제 중..."
      isPending={isDeleting}
      errorMessage={errorMessage}
      onConfirm={() => void handleConfirm()}
      onCancel={onClose}
    />
  );
}
