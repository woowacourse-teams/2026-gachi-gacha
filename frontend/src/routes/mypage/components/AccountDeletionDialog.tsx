import { type FormEvent, useEffect, useRef, useState } from 'react';

import {
  Actions,
  CloseButton,
  DangerButton,
  Description,
  Dialog,
  ErrorMessage,
  Field,
  FieldHint,
  FieldLabel,
  Form,
  Header,
  Input,
  Panel,
  SecondaryButton,
  Title,
  Warning,
} from './AccountDialog.styles';

const CONFIRMATION_TEXT = '탈퇴';

export interface AccountDeletionDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export function AccountDeletionDialog({
  open,
  onClose,
  onDelete,
}: AccountDeletionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      setConfirmation('');
      setErrorMessage(null);
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function closeDialog() {
    if (!isSubmitting) {
      dialogRef.current?.close();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmation !== CONFIRMATION_TEXT) {
      setErrorMessage(`확인을 위해 '${CONFIRMATION_TEXT}'를 입력해 주세요.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onDelete();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '회원 탈퇴를 완료하지 못했습니다.',
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      ref={dialogRef}
      aria-labelledby="account-deletion-title"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      data-private
    >
      <Panel>
        <Header>
          <div>
            <Title id="account-deletion-title">회원 탈퇴</Title>
            <Description>
              계정 삭제 요청을 완료하면 현재 브라우저에서도 로그아웃돼요.
            </Description>
          </div>
          <CloseButton
            type="button"
            aria-label="회원 탈퇴 창 닫기"
            onClick={closeDialog}
          >
            ×
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <Warning>
            탈퇴한 계정은 되돌릴 수 없습니다. 계속하려면 아래 입력란에{' '}
            <strong>{CONFIRMATION_TEXT}</strong>를 입력해 주세요.
          </Warning>

          <Field>
            <FieldLabel>확인 문구</FieldLabel>
            <Input
              value={confirmation}
              placeholder={CONFIRMATION_TEXT}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              autoFocus
            />
            <FieldHint>
              입력한 문구가 정확히 일치해야 탈퇴할 수 있어요.
            </FieldHint>
          </Field>

          {errorMessage && (
            <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
          )}

          <Actions>
            <SecondaryButton type="button" onClick={closeDialog}>
              취소
            </SecondaryButton>
            <DangerButton
              type="submit"
              disabled={isSubmitting || confirmation !== CONFIRMATION_TEXT}
            >
              {isSubmitting ? '탈퇴 처리 중...' : '회원 탈퇴'}
            </DangerButton>
          </Actions>
        </Form>
      </Panel>
    </Dialog>
  );
}
