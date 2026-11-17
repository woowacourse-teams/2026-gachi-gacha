import { useEffect, useId, useRef } from 'react';
import styled from '@emotion/styled';

import appStoreBadge from '@/assets/store-badges/app-store-ko.svg';
import googlePlayBadge from '@/assets/store-badges/google-play-ko.svg';
import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';

interface LaunchEventInstallDialogProps {
  onClose: () => void;
}

/** 스토어 이동은 사용자가 선택한다. 설치 후 자동 복귀를 약속하지 않는다. */
export function LaunchEventInstallDialog({
  onClose,
}: LaunchEventInstallDialogProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement;
    element.showModal();
    title.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <Dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <Header>
        <h2 id={`${id}-title`} ref={title} tabIndex={-1}>
          가치가챠 앱에서 <span>참여해 주세요</span>
        </h2>
        <CloseButton type="button" aria-label="닫기" onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </CloseButton>
      </Header>
      <Description id={`${id}-description`}>
        <p>이번 이벤트는 가치가챠 앱에서 응모할 수 있어요.</p>
        <p>앱 설치 후 로그인하고, 홈의 이벤트 배너에서 응모를 완료해 주세요.</p>
      </Description>
      <InstalledHint>이미 설치했다면 가치가챠 앱을 열어 주세요.</InstalledHint>
      <Badges>
        <a
          href="https://apps.apple.com/kr/app/가치가챠/id6830106803"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="App Store에서 가치가챠 다운로드 (새 창)"
        >
          <img src={appStoreBadge} alt="App Store에서 다운로드" height={40} />
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.gachigacha.app&pcampaignid=web_share"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Google Play에서 가치가챠 다운로드 (새 창)"
        >
          <img
            src={googlePlayBadge}
            alt="Google Play에서 다운로드"
            height={40}
          />
        </a>
      </Badges>
    </Dialog>
  );
}

const Dialog = styled.dialog`
  width: min(440px, calc(100vw - 32px));
  max-width: none;
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: ${space.lg};
  border: 0;
  border-radius: ${radius.dialog};
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: ${color.text};
  background: ${color.surface};
  box-shadow: ${shadow.dialog};

  @media (max-width: 599px) {
    width: min(440px, calc(100vw - 24px));
    padding-inline: ${space.md};
  }

  @media (max-width: 380px) {
    width: calc(100vw - 16px);
    padding-inline: ${space.sm};
  }

  /* 320px에서도 최소 높이 40px와 넓어진 배지 간격을 함께 확보한다. */
  @media (max-width: 340px) {
    width: calc(100vw - 12px);
  }

  &::backdrop {
    background: rgb(24 20 22 / 45%);
  }

  h2 {
    min-width: 0;
    margin: 0;
    font-size: ${fontSize.detailTitle};
    font-weight: ${fontWeight.bold};
    line-height: ${lineHeight.heading};
    letter-spacing: ${letterSpacing.heading};
    word-break: keep-all;
    overflow-wrap: break-word;

    span {
      display: inline-block;
    }

    &:focus {
      outline: none;
    }
  }

  p {
    margin: 0;
    color: ${color.textMuted};
    font-family: inherit;
    font-size: ${fontSize.bodySmall};
    font-weight: ${fontWeight.regular};
    line-height: ${lineHeight.relaxed};
    word-break: keep-all;
    overflow-wrap: anywhere;
  }

  a:focus-visible,
  button:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space.xs};
  margin-bottom: ${space.md};
`;

const Description = styled.div`
  display: grid;
  gap: ${space.xs};
`;

const InstalledHint = styled.p`
  && {
    margin-top: ${space.xs};
  }
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  /* 원본 비율과 높이의 1/4 이상 여백을 지키며 화면 여유만큼 키운다. */
  gap: ${space.md};
  padding-block: ${space.md};
  margin-top: ${space.xs};

  @media (min-width: 360px) {
    gap: ${space.lg};
  }

  a {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    min-height: 44px;
    border-radius: ${radius.small};
  }

  img {
    display: block;
    width: auto;
    height: 40px;

    @media (min-width: 360px) {
      height: 44px;
    }

    @media (min-width: 375px) {
      height: 46px;
    }

    @media (min-width: 412px) {
      height: 48px;
    }

    @media (min-width: 600px) {
      height: 56px;
    }
  }
`;

const CloseButton = styled.button`
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  padding: 0;
  border: 0;
  border-radius: ${radius.small};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;
  place-items: center;

  &:hover {
    color: ${color.text};
  }
`;
