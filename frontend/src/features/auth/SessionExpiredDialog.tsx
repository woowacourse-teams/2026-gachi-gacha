import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { subscribeToAuthenticationExpired } from './api/authenticatedFetch';
import { isMemberOnlyPath } from './memberOnlyPath';

/**
 * 로그인 상태에서 세션이 끝나면 확인 창으로 알린다.
 * 회원 전용 화면은 로그인 화면으로 바로 이동하므로 창을 띄우지 않는다.
 */
export function SessionExpiredDialog() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(
    () =>
      subscribeToAuthenticationExpired(() => {
        setIsOpen(true);
      }),
    [],
  );

  const isSuppressed =
    location.pathname === '/login' || isMemberOnlyPath(location.pathname);

  useEffect(() => {
    if (isSuppressed) {
      setIsOpen(false);
    }
  }, [isSuppressed]);

  return (
    <ConfirmDialog
      open={isOpen && !isSuppressed}
      title="로그인이 만료됐어요"
      description="다시 로그인하면 보던 화면으로 돌아와요."
      cancelLabel="나중에"
      confirmLabel="로그인"
      onCancel={() => setIsOpen(false)}
      onConfirm={() => {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;

        setIsOpen(false);
        void navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      }}
    />
  );
}
