const AUTH_SESSION_MESSAGE_TYPE = 'gachigacha:auth-refresh-token';

interface NativeWebViewBridge {
  postMessage: (message: string) => void;
}

/** 일반 브라우저에는 브리지가 없으므로 iOS WebView에서만 동작한다. */
export function syncNativeRefreshToken(token: string | null): void {
  const bridge = (
    window as Window & { ReactNativeWebView?: NativeWebViewBridge }
  ).ReactNativeWebView;

  if (!bridge) return;

  try {
    bridge.postMessage(
      JSON.stringify({ type: AUTH_SESSION_MESSAGE_TYPE, token }),
    );
  } catch {
    // 네이티브 브리지 실패가 웹 로그인·로그아웃을 막지 않도록 한다.
  }
}
