import { useEffect, useId, useRef } from 'react';
import styled from '@emotion/styled';

import appStoreBadge from '@/assets/store-badges/app-store-ko.svg';
import googlePlayBadge from '@/assets/store-badges/google-play-ko.svg';
import { color, focusRing, fontWeight, radius } from '@/shared/styles/tokens';

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
      <h2 id={`${id}-title`} ref={title} tabIndex={-1}>
        가치가챠 앱에서 참여해 주세요
      </h2>
      <div id={`${id}-description`}>
        <p>이번 이벤트는 가치가챠 앱에서 응모할 수 있어요.</p>
        <p>앱 설치 후 로그인하고, 홈의 이벤트 배너에서 응모를 완료해 주세요.</p>
      </div>
      <Badges>
        <a
          href="https://apps.apple.com/kr/app/가치가챠/id6830106803"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="App Store에서 가치가챠 다운로드 (새 창)"
        >
          <img src={appStoreBadge} alt="App Store에서 다운로드" height={48} />
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
            height={48}
          />
        </a>
      </Badges>
      <p>이미 설치했다면 가치가챠 앱을 열어 주세요.</p>
      <CloseButton type="button" onClick={onClose}>
        닫기
      </CloseButton>
    </Dialog>
  );
}

const Dialog = styled.dialog`
  width: min(440px, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: 24px;
  border: 0;
  border-radius: ${radius.dialog};
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: ${color.text};
  background: ${color.surface};

  &::backdrop {
    background: rgb(24 20 22 / 45%);
  }

  h2 {
    margin: 0 0 16px;
    font-size: 20px;
    line-height: 1.5;
    overflow-wrap: anywhere;

    &:focus {
      outline: none;
    }
  }

  p {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }

  a:focus-visible,
  button:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0 12px;
  margin: 12px 0;

  a {
    display: inline-flex;
    padding: 12px;
    border-radius: ${radius.small};
  }

  img {
    display: block;
    width: auto;
    height: 48px;
  }
`;

const CloseButton = styled.button`
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font: inherit;
  font-weight: ${fontWeight.bold};
  cursor: pointer;
`;
