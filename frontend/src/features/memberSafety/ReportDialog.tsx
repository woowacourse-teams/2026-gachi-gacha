import { useEffect, useId, useRef, useState } from 'react';
import styled from '@emotion/styled';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';
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

import type { MemberSafetySource } from './MemberBlockContext';

export const MEMBER_REPORT_REASONS = [
  { value: 'spam', label: '스팸·광고' },
  { value: 'fraud', label: '사기·외부 거래 유도' },
  { value: 'harassment', label: '욕설·괴롭힘' },
  { value: 'inappropriate', label: '음란·부적절한 콘텐츠' },
  { value: 'privacy', label: '개인정보 노출' },
  { value: 'other', label: '기타' },
] as const;

export type MemberReportReason =
  (typeof MEMBER_REPORT_REASONS)[number]['value'];

export interface MemberReportSubmission {
  reason: MemberReportReason;
  details: string;
}

interface ReportDialogProps {
  open: boolean;
  targetNickname: string;
  source: MemberSafetySource;
  onClose: () => void;
  /** 신고 API가 확정된 뒤 실제 전송 함수를 주입한다. 없으면 제출을 허용하지 않는다. */
  onSubmit?: (submission: MemberReportSubmission) => Promise<void>;
}

export function ReportDialog({
  open,
  targetNickname,
  source,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState<MemberReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setReason('');
    setDetails('');
    setErrorMessage(null);
    setIsSubmitted(false);
    closeButtonRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  async function submitReport() {
    if (!onSubmit || !reason || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({ reason, details: details.trim() });
      setIsSubmitted(true);
      captureAnalyticsEvent('member_report_submission_completed', {
        source,
        reason,
        outcome: 'success',
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '신고를 접수하지 못했습니다.',
      );
      captureAnalyticsEvent('member_report_submission_completed', {
        source,
        reason,
        outcome: 'failure',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Overlay
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <Panel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !isSubmitting) {
            onClose();
          }
        }}
      >
        <DialogHeader>
          <div>
            <Title id={titleId}>{targetNickname}님 신고하기</Title>
            <Description id={descriptionId}>
              문제가 되는 이유를 선택해 주세요.
            </Description>
          </div>
          <CloseButton
            ref={closeButtonRef}
            type="button"
            aria-label="신고 창 닫기"
            disabled={isSubmitting}
            onClick={onClose}
          >
            ×
          </CloseButton>
        </DialogHeader>

        {isSubmitted ? (
          <Submitted role="status">
            <strong>신고를 접수했어요.</strong>
            <span>확인 후 필요한 조치를 진행할게요.</span>
          </Submitted>
        ) : (
          <>
            <ReasonGroup>
              {MEMBER_REPORT_REASONS.map((item) => (
                <ReasonLabel key={item.value}>
                  <input
                    type="radio"
                    name="member-report-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                  />
                  <span>{item.label}</span>
                </ReasonLabel>
              ))}
            </ReasonGroup>
            <DetailsLabel>
              자세한 내용 (선택)
              <DetailsInput
                value={details}
                maxLength={500}
                placeholder="확인에 필요한 내용을 적어주세요."
                onChange={(event) => setDetails(event.target.value)}
              />
            </DetailsLabel>

            {!onSubmit && (
              <PreparationNotice role="status">
                신고 접수 기능을 준비하고 있어요. 긴급한 신고는{' '}
                <a
                  href={SUPPORT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  고객센터
                </a>
                로 알려주세요.
              </PreparationNotice>
            )}
            {errorMessage && (
              <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
            )}
            <Actions>
              <CancelButton
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
              >
                취소
              </CancelButton>
              <SubmitButton
                type="button"
                disabled={!onSubmit || !reason || isSubmitting}
                aria-busy={isSubmitting}
                onClick={() => void submitReport()}
              >
                {!onSubmit
                  ? '접수 준비 중'
                  : isSubmitting
                    ? '접수 중...'
                    : '신고 접수'}
              </SubmitButton>
            </Actions>
          </>
        )}
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
  background: rgb(24 21 22 / 52%);
`;

const Panel = styled.div`
  box-sizing: border-box;
  width: min(100%, 460px);
  max-height: min(720px, calc(100dvh - 32px));
  padding: ${space.xl};
  overflow-y: auto;
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.dialog};
`;

const DialogHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space.md};
`;

const Title = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.extraBold};
`;

const Description = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 0;
  border-radius: ${radius.circle};
  background: ${color.surfaceMuted};
  color: ${color.text};
  cursor: pointer;
  font-size: 24px;
  line-height: 1;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const ReasonGroup = styled.div`
  display: grid;
  margin-top: ${space.lg};
  gap: ${space.xs};
`;

const ReasonLabel = styled.label`
  display: flex;
  min-height: 44px;
  padding: 0 ${space.sm};
  align-items: center;
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  cursor: pointer;
  gap: ${space.sm};
  font-size: ${fontSize.bodySmall};

  &:has(input:checked) {
    border-color: ${color.primary};
    background: ${color.primarySoft};
  }

  input {
    accent-color: ${color.primary};
  }
`;

const DetailsLabel = styled.label`
  display: grid;
  margin-top: ${space.md};
  color: ${color.text};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  gap: ${space.xs};
`;

const DetailsInput = styled.textarea`
  min-height: 92px;
  padding: ${space.sm};
  resize: vertical;
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  color: ${color.text};
  font: inherit;
  font-weight: ${fontWeight.regular};
  line-height: ${lineHeight.body};

  &:focus-visible {
    border-color: ${color.primary};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const PreparationNotice = styled.p`
  padding: ${space.sm};
  border-radius: ${radius.control};
  margin: ${space.md} 0 0;
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};

  a {
    color: ${color.primary};
    font-weight: ${fontWeight.bold};
  }
`;

const ErrorMessage = styled.p`
  margin: ${space.sm} 0 0;
  color: #d80f42;
  font-size: ${fontSize.caption};
`;

const Actions = styled.div`
  display: grid;
  margin-top: ${space.lg};
  grid-template-columns: 1fr 1fr;
  gap: ${space.xs};
`;

const actionButtonStyle = `
  min-height: 44px;
  border-radius: ${radius.control};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const CancelButton = styled.button`
  ${actionButtonStyle}
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
`;

const SubmitButton = styled.button`
  ${actionButtonStyle}
  border: 0;
  background: ${color.primary};
  color: #ffffff;
`;

const Submitted = styled.div`
  display: grid;
  min-height: 180px;
  place-content: center;
  justify-items: center;
  color: ${color.text};
  gap: ${space.xs};
  text-align: center;

  strong {
    font-size: ${fontSize.subheading};
  }

  span {
    color: ${color.textMuted};
    font-size: ${fontSize.bodySmall};
  }
`;
