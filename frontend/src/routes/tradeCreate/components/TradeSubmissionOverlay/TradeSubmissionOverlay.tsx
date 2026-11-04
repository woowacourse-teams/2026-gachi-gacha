import { useEffect, useRef } from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

type TradeSubmissionOverlayProps =
  | {
      stage: 'compressing';
      percentage: number;
      completedCount: number;
      totalCount: number;
      action: 'create' | 'edit';
    }
  | {
      stage: 'uploading';
      action: 'create' | 'edit';
    };

export default function TradeSubmissionOverlay(
  props: TradeSubmissionOverlayProps,
) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const isCompressing = props.stage === 'compressing';
  const title = isCompressing
    ? '이미지 최적화 중'
    : `게시글 ${props.action === 'edit' ? '수정' : '등록'} 중`;

  return (
    <Backdrop>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-submission-title"
        aria-describedby="trade-submission-description"
        tabIndex={-1}
      >
        <StatusIcon aria-hidden="true" data-uploading={!isCompressing}>
          {isCompressing ? <ImageIcon /> : <Spinner />}
        </StatusIcon>
        <Title id="trade-submission-title">{title}</Title>
        <Description id="trade-submission-description" aria-live="polite">
          {isCompressing
            ? '사진을 더 빠르게 볼 수 있도록 준비하고 있어요.'
            : '잠시만 기다리면 게시글로 이동해요.'}
        </Description>

        {isCompressing && (
          <ProgressSection>
            <ProgressMeta>
              <span>
                {props.completedCount}/{props.totalCount}개 처리 중
              </span>
              <strong>{props.percentage}%</strong>
            </ProgressMeta>
            <ProgressTrack
              role="progressbar"
              aria-label="이미지 최적화 진행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={props.percentage}
              aria-valuetext={`${props.totalCount}개 중 ${props.completedCount}개 처리, ${props.percentage}%`}
            >
              <ProgressValue style={{ width: `${props.percentage}%` }} />
            </ProgressTrack>
          </ProgressSection>
        )}
      </Dialog>
    </Backdrop>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="9" cy="9.5" r="1.7" fill="currentColor" />
      <path
        d="m5.5 17 4.2-4.2 2.8 2.7 2.1-2.1 3.9 3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  z-index: 1000;
  display: grid;
  padding: 24px;
  background: rgb(24 24 27 / 48%);
  inset: 0;
  place-items: center;
  overscroll-behavior: contain;
  touch-action: none;
`;

const Dialog = styled.div`
  box-sizing: border-box;
  width: min(100%, 380px);
  padding: 34px 28px 30px;
  border-radius: 22px;
  outline: none;
  background: #ffffff;
  box-shadow: 0 22px 70px rgb(18 18 22 / 24%);
  text-align: center;
`;

const StatusIcon = styled.div`
  display: grid;
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  place-items: center;
  border-radius: 20px;
  background: #fff0f4;
  color: #ed174c;

  &[data-uploading='true'] {
    border-radius: 50%;
  }
`;

const Spinner = styled.span`
  width: 26px;
  height: 26px;
  box-sizing: border-box;
  border: 3px solid rgb(237 23 76 / 22%);
  border-top-color: #ed174c;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1.8s;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #202126;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const Description = styled.p`
  margin: 10px 0 0;
  color: #73757e;
  font-size: 14px;
  line-height: 1.55;
`;

const ProgressSection = styled.div`
  margin-top: 26px;
`;

const ProgressMeta = styled.div`
  display: flex;
  margin-bottom: 10px;
  align-items: center;
  justify-content: space-between;
  color: #73757e;
  font-size: 13px;

  strong {
    color: #ed174c;
    font-size: 14px;
  }
`;

const ProgressTrack = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f0f0f2;
`;

const ProgressValue = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ed174c, #ff5d82);
  transition: width 180ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
