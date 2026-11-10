import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { useMemberBlocks, type MemberSafetySource } from './MemberBlockContext';

interface UserSafetyMenuProps {
  targetMemberId: number | null;
  targetNickname: string;
  source: MemberSafetySource;
  referenceId?: string | null;
  onBlocked?: (() => void) | undefined;
  /** `toolbar`: 앱 상단 바처럼 44px 영역에 선 아이콘으로 표시한다. */
  triggerVariant?: 'compact' | 'toolbar';
}

export function UserSafetyMenu({
  targetMemberId,
  targetNickname,
  source,
  referenceId = null,
  onBlocked,
  triggerVariant = 'compact',
}: UserSafetyMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { blockMember, openMemberReport } = useMemberBlocks();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function closeMenu(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [isMenuOpen]);

  async function confirmBlock() {
    if (targetMemberId === null || isBlocking) {
      return;
    }

    setIsBlocking(true);
    setBlockError(null);

    try {
      await blockMember(targetMemberId, source, targetNickname, referenceId);
      setIsBlockConfirmOpen(false);
      onBlocked?.();
    } catch (error) {
      setBlockError(
        error instanceof Error
          ? error.message
          : '사용자를 차단하지 못했습니다.',
      );
    } finally {
      setIsBlocking(false);
    }
  }

  return (
    <>
      <MenuRoot ref={rootRef}>
        <MenuButton
          type="button"
          aria-label={`${targetNickname} 사용자 메뉴`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          data-variant={triggerVariant}
          onClick={() => {
            setIsMenuOpen((open) => !open);
            captureAnalyticsEvent('member_safety_menu_opened', { source });
          }}
        >
          {triggerVariant === 'toolbar' ? (
            <EllipsisIcon />
          ) : (
            <span aria-hidden="true">•••</span>
          )}
        </MenuButton>
        {isMenuOpen && (
          <Menu role="menu">
            <MenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                openMemberReport({
                  memberId: targetMemberId,
                  nickname: targetNickname,
                  source,
                  referenceId,
                });
              }}
            >
              신고하기
            </MenuItem>
            {targetMemberId !== null && (
              <DangerMenuItem
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  setBlockError(null);
                  setIsBlockConfirmOpen(true);
                }}
              >
                차단하기
              </DangerMenuItem>
            )}
          </Menu>
        )}
      </MenuRoot>

      <ConfirmDialog
        open={isBlockConfirmOpen}
        title={`${targetNickname}님을 차단할까요?`}
        description="이 사용자의 교환글, 댓글과 채팅이 보이지 않아요. 마이페이지에서 언제든 차단을 해제할 수 있어요."
        confirmLabel="차단하기"
        pendingLabel="차단 중..."
        isPending={isBlocking}
        errorMessage={blockError}
        onCancel={() => setIsBlockConfirmOpen(false)}
        onConfirm={() => void confirmBlock()}
      />
    </>
  );
}

function EllipsisIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

const MenuRoot = styled.div`
  position: relative;
  flex: 0 0 auto;
`;

const MenuButton = styled.button`
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${radius.circle};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;
  font-size: 15px;
  letter-spacing: 1px;

  &:hover {
    background: ${color.surfaceMuted};
    color: ${color.text};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &[data-variant='toolbar'] {
    width: 44px;
    height: 44px;
    color: ${color.text};
  }
`;

const Menu = styled.div`
  position: absolute;
  z-index: 5;
  top: calc(100% + 4px);
  right: 0;
  display: grid;
  width: 132px;
  padding: 5px;
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  box-shadow: ${shadow.card};
`;

const MenuItem = styled.button`
  min-height: 40px;
  padding: 0 ${space.sm};
  border: 0;
  border-radius: ${radius.small};
  background: transparent;
  color: ${color.text};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-align: left;

  &:hover {
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const DangerMenuItem = styled(MenuItem)`
  color: #d80f42;
`;
