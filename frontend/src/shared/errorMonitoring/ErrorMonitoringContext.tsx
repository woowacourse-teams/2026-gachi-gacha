import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { readAccessToken } from '@/features/auth/authTokenStorage';
import { readMemberIdFromAccessToken } from '@/features/auth/readMemberIdFromAccessToken';

import {
  setErrorMonitoringRoute,
  setErrorMonitoringUser,
} from './errorMonitoringClient';

export function ErrorMonitoringContext() {
  const { pathname } = useLocation();
  const { status } = useAuthSession();

  useEffect(() => {
    setErrorMonitoringRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setErrorMonitoringUser(null);
      return;
    }

    const accessToken = readAccessToken();
    const memberId = accessToken
      ? readMemberIdFromAccessToken(accessToken)
      : null;

    setErrorMonitoringUser(memberId);
  }, [status]);

  return null;
}
