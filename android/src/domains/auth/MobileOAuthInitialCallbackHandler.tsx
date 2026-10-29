import { useEffect } from 'react';
import { Linking, ToastAndroid } from 'react-native';

import { useAuthSession } from './AuthSessionContext';
import {
  completeMobileOAuthCallback,
  isConfiguredMobileOAuthCallbackUrl,
} from './mobileOAuthLogin';
import { readPendingOAuthLogin } from './oauthPendingLoginStorage';
import { traceMobileOAuth } from './oauthDiagnostics';

export function MobileOAuthInitialCallbackHandler() {
  const { authenticate, status } = useAuthSession();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    let active = true;

    async function restoreInitialCallback() {
      let callbackProvider: 'kakao' | 'naver' | null = null;

      try {
        const initialUrl = await Linking.getInitialURL();

        if (
          !active ||
          !initialUrl ||
          !isConfiguredMobileOAuthCallbackUrl(initialUrl)
        ) {
          return;
        }

        const pending = await readPendingOAuthLogin();

        if (!active || !pending) {
          return;
        }

        callbackProvider = pending.provider;
        traceMobileOAuth(pending.provider, 'cold_start_callback_received');
        const tokens = await completeMobileOAuthCallback(initialUrl);

        if (!active) {
          return;
        }

        await authenticate(tokens);
        traceMobileOAuth(pending.provider, 'session_authenticated', {
          source: 'cold_start',
        });
        ToastAndroid.show('로그인되었습니다.', ToastAndroid.SHORT);
      } catch {
        if (!callbackProvider) {
          return;
        }

        traceMobileOAuth(callbackProvider, 'cold_start_callback_failed');
        ToastAndroid.show(
          '로그인을 완료하지 못했습니다. 다시 시도해 주세요.',
          ToastAndroid.LONG,
        );
      }
    }

    void restoreInitialCallback();

    return () => {
      active = false;
    };
  }, [authenticate, status]);

  return null;
}
