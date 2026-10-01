import { useEffect, useId, useRef } from 'react';
import styled from '@emotion/styled';

import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  shadow,
  space,
  zIndex,
} from '@/shared/styles/tokens';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  isPending?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 되돌릴 수 없는 작업 전에 한 번 더 확인받는 창. 열리면 취소 버튼에 포커스를 둔다. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = confirmLabel,
  isPending = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function cancel() {
    if (!isPending) {
      onCancel();
    }
  }

  return (
    <Overlay
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          cancel();
        }
      }}
    >
      <Panel
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            cancel();
          }
        }}
      >
        <Title id={titleId}>{title}</Title>
        <Description id={descriptionId}>{description}</Description>
        {errorMessage && (
          <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
        )}
        <Actions>
          <CancelButton
            ref={cancelButtonRef}
            type="button"
            disabled={isPending}
            onClick={cancel}
          >
            취소
          </CancelButton>
          <ConfirmButton
            type="button"
            disabled={isPending}
            aria-busy={isPending}
            onClick={onConfirm}
          >
            {isPending ? pendingLabel : confirmLabel}
          </ConfirmButton>
        </Actions>
      </Panel>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  z-index: ${zIndex.overlay};
  inset: 0;
  display: grid;
  padding: ${space.lg};
  place-items: center;
  background: rgb(24 21 22 / 48%);
`;

const Panel = styled.div`
  box-sizing: border-box;
  width: min(100%, 400px);
  padding: ${space.xl};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.dialog};
`;

const Title = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.heading};
`;

const Description = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};
`;

const ErrorMessage = styled.p`
  margin: ${space.sm} 0 0;
  color: #d80f42;
  font-size: ${fontSize.label};
  line-height: ${lineHeight.body};
`;

const Actions = styled.div`
  display: grid;
  margin-top: ${space.xl};
  grid-template-columns: 1fr 1fr;
  gap: ${space.xs};
`;

const buttonStyle = `
  min-height: 44px;
  border-radius: ${radius.control};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;

const CancelButton = styled.button`
  ${buttonStyle}
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
`;

const ConfirmButton = styled.button`
  ${buttonStyle}
  border: 0;
  background: #d80f42;
  color: #ffffff;

  &:not(:disabled):hover {
    background: #b80c38;
  }
`;
