import { type ReactNode, useEffect } from 'react';

import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import { createLoginUrl } from './authReturnPath';
import { useAuthSession } from './AuthSessionContext';

export interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuthSession();

  useEffect(() => {
    if (status !== 'guest' && status !== 'error') {
      return;
    }

    const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    window.location.replace(createLoginUrl(returnPath));
  }, [status]);

  if (status !== 'authenticated') {
    return (
      <PageLoadingFallback label="로그인이 필요한 페이지로 이동하고 있어요." />
    );
  }

  return children;
}
