import { type FormEvent, useEffect, useRef, useState } from 'react';

import {
  Actions,
  CloseButton,
  Description,
  Dialog,
  ErrorMessage,
  Field,
  FieldLabel,
  FieldMeta,
  Form,
  Header,
  Panel,
  PrivacyHint,
  SecondaryButton,
  Select,
  SubmitButton,
  Success,
  SuccessIcon,
  Textarea,
  Title,
} from './SupportInquiryDialog.styles';
import {
  submitSupportInquiry,
  type SupportInquiryCategory,
} from '../api/submitSupportInquiry';

const CATEGORY_OPTIONS: readonly {
  value: SupportInquiryCategory;
  label: string;
}[] = [
  { value: 'SERVICE', label: '서비스 이용 문의' },
  { value: 'BUG', label: '오류 신고' },
  { value: 'DATA', label: '매장·가챠 정보 제보' },
  { value: 'OTHER', label: '기타 의견' },
];

const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 1000;

export interface SupportInquiryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SupportInquiryDialog({
  open,
  onClose,
}: SupportInquiryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [category, setCategory] = useState<SupportInquiryCategory>('SERVICE');
  const [content, setContent] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'submitting' | 'success'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      setErrorMessage(null);
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function closeDialog() {
    if (submissionStatus === 'submitting') {
      return;
    }

    if (submissionStatus === 'success') {
      setContent('');
      setSubmissionStatus('idle');
    }

    dialogRef.current?.close();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedContent = content.trim();

    if (normalizedContent.length < MIN_CONTENT_LENGTH) {
      setErrorMessage('문의 내용을 10자 이상 입력해 주세요.');
      return;
    }

    setSubmissionStatus('submitting');
    setErrorMessage(null);

    try {
      await submitSupportInquiry({ category, content: normalizedContent });
      setSubmissionStatus('success');
    } catch (error) {
      setSubmissionStatus('idle');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '문의를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <Dialog
      ref={dialogRef}
      aria-labelledby="support-dialog-title"
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
        {submissionStatus === 'success' ? (
          <Success role="status">
            <SuccessIcon aria-hidden="true">✓</SuccessIcon>
            <Title id="support-dialog-title">문의가 접수됐어요</Title>
            <Description>
              보내주신 내용을 확인한 뒤 서비스 개선에 반영할게요.
            </Description>
            <SubmitButton type="button" onClick={closeDialog}>
              확인
            </SubmitButton>
          </Success>
        ) : (
          <>
            <Header>
              <div>
                <Title id="support-dialog-title">고객센터 문의</Title>
                <Description>
                  불편했던 점이나 제안하고 싶은 내용을 자유롭게 남겨주세요.
                </Description>
              </div>
              <CloseButton
                type="button"
                aria-label="문의 창 닫기"
                onClick={closeDialog}
              >
                ×
              </CloseButton>
            </Header>

            <Form onSubmit={handleSubmit}>
              <Field>
                <FieldLabel>문의 유형</FieldLabel>
                <Select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as SupportInquiryCategory)
                  }
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <FieldLabel>문의 내용</FieldLabel>
                <Textarea
                  value={content}
                  minLength={MIN_CONTENT_LENGTH}
                  maxLength={MAX_CONTENT_LENGTH}
                  placeholder="어떤 점이 불편했는지 자세히 알려주세요."
                  onChange={(event) => setContent(event.target.value)}
                  autoFocus
                  required
                />
                <FieldMeta>
                  {content.length} / {MAX_CONTENT_LENGTH}자
                </FieldMeta>
              </Field>

              <PrivacyHint>
                문의는 로그인한 계정과 함께 전달됩니다. 비밀번호나 주민등록번호
                같은 민감정보는 입력하지 마세요. 자세한 내용은{' '}
                <a href="/privacy" target="_blank" rel="noreferrer">
                  개인정보처리방침
                </a>
                을 확인해 주세요.
              </PrivacyHint>

              {errorMessage && (
                <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
              )}

              <Actions>
                <SecondaryButton type="button" onClick={closeDialog}>
                  취소
                </SecondaryButton>
                <SubmitButton
                  type="submit"
                  disabled={submissionStatus === 'submitting'}
                >
                  {submissionStatus === 'submitting'
                    ? '전송 중...'
                    : '문의 전송'}
                </SubmitButton>
              </Actions>
            </Form>
          </>
        )}
      </Panel>
    </Dialog>
  );
}
