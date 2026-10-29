import type { AuthTokens, MobileOAuthProvider } from '../auth/authTypes';

const ACCESS_TOKEN_STORAGE_KEY = 'gachi-gacha:access-token';
const REFRESH_TOKEN_STORAGE_KEY = 'gachi-gacha:refresh-token';
const DEFAULT_PROFILE_IMAGE_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23fce9ef'/%3E%3Ccircle cx='48' cy='36' r='17' fill='%23c8899d'/%3E%3Cpath d='M18 89c2-20 14-31 30-31s28 11 30 31' fill='%23c8899d'/%3E%3C/svg%3E";

const ANDROID_WEB_SHELL_STYLES = `
  @keyframes gachigacha-android-dismiss-location-error {
    0%, 72% {
      opacity: 1;
      visibility: visible;
    }
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }

  html[data-gachigacha-native-platform="android"] [data-gachigacha-android-apple-login] {
    display: none !important;
  }

  html[data-gachigacha-native-platform="android"] [data-gachigacha-android-avatar-fallback] {
    overflow: hidden !important;
    background-color: #fce9ef !important;
    background-image: url("${DEFAULT_PROFILE_IMAGE_DATA_URI}") !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
    background-size: cover !important;
    color: transparent !important;
    font-size: 0 !important;
  }

  html[data-gachigacha-native-platform="android"] img[data-gachigacha-android-avatar-fallback-image] {
    display: block !important;
    object-fit: cover !important;
  }

  @media (max-width: 767px) {
    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-header] {
      top: 12px !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-research] {
      top: var(--gachigacha-android-map-research-top, 96px) !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-controls] {
      bottom: var(--gachigacha-android-map-controls-bottom, 190px) !important;
      gap: 10px !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-status] {
      position: relative !important;
      z-index: 4 !important;
      min-height: 28px !important;
      align-items: center !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-status] [id="search-store-list-title"],
    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-status] [id="search-store-list-title"] *,
    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-status] [id="search-store-list-title"] ~ span {
      align-items: center !important;
      color: #242122 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      vertical-align: middle !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-map-list-area] {
      bottom: 4px !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-location-error] {
      animation: gachigacha-android-dismiss-location-error 4s ease forwards !important;
      pointer-events: none !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-main] {
      box-sizing: border-box !important;
      width: calc(100% - 24px) !important;
      max-width: calc(100% - 24px) !important;
      height: var(--gachigacha-android-chat-height, auto) !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-height: var(--gachigacha-android-chat-height, none) !important;
      margin: 12px auto !important;
      overflow: hidden !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-main] > aside,
    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-main] > section,
    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-room] {
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-list] {
      height: 100% !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-list] button {
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-room] * {
      box-sizing: border-box !important;
      min-width: 0;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-drawer] {
      top: 12px !important;
      right: 12px !important;
      bottom: 12px !important;
      left: 12px !important;
      box-sizing: border-box !important;
      width: auto !important;
      max-width: none !important;
      height: auto !important;
      overflow: hidden !important;
      border-radius: 20px !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-composer-area] {
      box-sizing: border-box !important;
      width: 100% !important;
      padding: 12px 12px max(12px, env(safe-area-inset-bottom)) !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-composer] {
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      padding-right: 6px !important;
      padding-left: 10px !important;
      gap: 8px !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-composer] input[aria-label="메시지"] {
      width: 0 !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-chat-composer] button[type="submit"] {
      max-width: 92px !important;
      flex: 0 0 auto !important;
      white-space: nowrap !important;
    }
  }
`;

export const WEB_AUTH_REFRESH_TOKEN_MESSAGE =
  'gachigacha:auth-refresh-token';
export const WEB_NATIVE_BRIDGE_READY_MESSAGE =
  'gachigacha:native-bridge-ready';
export const WEB_PUSH_TOKEN_REQUEST_MESSAGE =
  'gachigacha:push-token-request';

export type WebShellNavigationDecision =
  | { type: 'allow' }
  | { provider: MobileOAuthProvider; type: 'native-oauth' }
  | { type: 'unsupported-oauth' }
  | { type: 'external' }
  | { type: 'block' };

export type WebShellMessage =
  | { token: string | null; type: 'auth-refresh-token' }
  | { type: 'native-bridge-ready' }
  | { type: 'push-token-request' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeOrigin(value: string): string {
  const url = new URL(value);

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('WebView 기준 주소는 경로가 없는 HTTPS origin이어야 합니다.');
  }

  return url.origin;
}

function readOAuthProvider(pathname: string): MobileOAuthProvider | 'apple' | null {
  const match = /^\/api\/v1\/oauth\/(kakao|naver|apple)\/?$/.exec(pathname);

  return (match?.[1] as MobileOAuthProvider | 'apple' | undefined) ?? null;
}

export function classifyWebShellNavigation(
  appBaseUrl: string,
  value: string,
): WebShellNavigationDecision {
  if (value === 'about:blank') {
    return { type: 'allow' };
  }

  let candidate: URL;
  let appOrigin: string;

  try {
    candidate = new URL(value);
    appOrigin = normalizeOrigin(appBaseUrl);
  } catch {
    return { type: 'block' };
  }

  if (candidate.protocol === 'https:' && candidate.origin === appOrigin) {
    const provider = readOAuthProvider(candidate.pathname);

    if (provider === 'kakao' || provider === 'naver') {
      return { type: 'native-oauth', provider };
    }

    if (provider === 'apple') {
      return { type: 'unsupported-oauth' };
    }

    return { type: 'allow' };
  }

  if (['https:', 'mailto:', 'tel:'].includes(candidate.protocol)) {
    return { type: 'external' };
  }

  return { type: 'block' };
}

export function isTrustedWebShellMessageSource(
  appBaseUrl: string,
  value: string,
): boolean {
  try {
    const candidate = new URL(value);
    return (
      candidate.protocol === 'https:' &&
      candidate.origin === normalizeOrigin(appBaseUrl)
    );
  } catch {
    return false;
  }
}

export function parseWebShellMessage(value: string): WebShellMessage | null {
  let message: unknown;

  try {
    message = JSON.parse(value);
  } catch {
    return null;
  }

  if (!isRecord(message) || typeof message.type !== 'string') {
    return null;
  }

  if (message.type === WEB_NATIVE_BRIDGE_READY_MESSAGE) {
    return { type: 'native-bridge-ready' };
  }

  if (message.type === WEB_PUSH_TOKEN_REQUEST_MESSAGE) {
    return { type: 'push-token-request' };
  }

  if (message.type !== WEB_AUTH_REFRESH_TOKEN_MESSAGE) {
    return null;
  }

  if (message.token === null) {
    return { token: null, type: 'auth-refresh-token' };
  }

  if (typeof message.token !== 'string' || !message.token.trim()) {
    return null;
  }

  return {
    token: message.token.trim(),
    type: 'auth-refresh-token',
  };
}

function serializeForInlineScript(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function createTokenStorageScript(tokens: AuthTokens | null): string {
  if (!tokens) {
    return `
      window.sessionStorage.removeItem(${serializeForInlineScript(ACCESS_TOKEN_STORAGE_KEY)});
      window.sessionStorage.removeItem(${serializeForInlineScript(REFRESH_TOKEN_STORAGE_KEY)});
    `;
  }

  return `
    window.sessionStorage.setItem(
      ${serializeForInlineScript(ACCESS_TOKEN_STORAGE_KEY)},
      ${serializeForInlineScript(tokens.accessToken)},
    );
    window.sessionStorage.setItem(
      ${serializeForInlineScript(REFRESH_TOKEN_STORAGE_KEY)},
      ${serializeForInlineScript(tokens.refreshToken)},
    );
  `;
}

function createTokenStorageSyncScript(tokens: AuthTokens | null): string {
  if (!tokens) {
    return `
      const sessionChanged =
        window.sessionStorage.getItem(${serializeForInlineScript(ACCESS_TOKEN_STORAGE_KEY)}) !== null ||
        window.sessionStorage.getItem(${serializeForInlineScript(REFRESH_TOKEN_STORAGE_KEY)}) !== null;
      if (sessionChanged) {
        window.sessionStorage.removeItem(${serializeForInlineScript(ACCESS_TOKEN_STORAGE_KEY)});
        window.sessionStorage.removeItem(${serializeForInlineScript(REFRESH_TOKEN_STORAGE_KEY)});
      }
    `;
  }

  return `
    const nextAccessToken = ${serializeForInlineScript(tokens.accessToken)};
    const nextRefreshToken = ${serializeForInlineScript(tokens.refreshToken)};
    const sessionChanged =
      window.sessionStorage.getItem(${serializeForInlineScript(ACCESS_TOKEN_STORAGE_KEY)}) !== nextAccessToken ||
      window.sessionStorage.getItem(${serializeForInlineScript(REFRESH_TOKEN_STORAGE_KEY)}) !== nextRefreshToken;
    if (sessionChanged) {
      window.sessionStorage.setItem(
        ${serializeForInlineScript(ACCESS_TOKEN_STORAGE_KEY)},
        nextAccessToken,
      );
      window.sessionStorage.setItem(
        ${serializeForInlineScript(REFRESH_TOKEN_STORAGE_KEY)},
        nextRefreshToken,
      );
    }
  `;
}

function createWebShellRuntimeBody(): string {
  return `
    document.documentElement.dataset.gachigachaNativePlatform = 'android';

    const refreshTokenKey = ${serializeForInlineScript(REFRESH_TOKEN_STORAGE_KEY)};
    const postRefreshToken = (token) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: ${serializeForInlineScript(WEB_AUTH_REFRESH_TOKEN_MESSAGE)},
        token,
      }));
    };

    if (!window.__gachigachaAndroidAuthStorageBridgeInstalled) {
      window.__gachigachaAndroidAuthStorageBridgeInstalled = true;
      const originalSetItem = Storage.prototype.setItem;
      const originalRemoveItem = Storage.prototype.removeItem;

      Storage.prototype.setItem = function(key, value) {
        originalSetItem.call(this, key, value);
        if (this === window.sessionStorage && key === refreshTokenKey) {
          postRefreshToken(String(value));
        }
      };

      Storage.prototype.removeItem = function(key) {
        originalRemoveItem.call(this, key);
        if (this === window.sessionStorage && key === refreshTokenKey) {
          postRefreshToken(null);
        }
      };
    }

    const styleId = 'gachigacha-android-webview-style';
    const installAndroidStyle = () => {
      if (document.getElementById(styleId)) return;
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = ${serializeForInlineScript(ANDROID_WEB_SHELL_STYLES)};
      (document.head || document.documentElement).appendChild(style);
    };

    const markAppleLogin = () => {
      if (window.location.pathname !== '/login') return;

      document.querySelectorAll('a, button').forEach((element) => {
        const href = element instanceof HTMLAnchorElement ? element.href : '';
        const label = [
          element.getAttribute('aria-label') || '',
          element.getAttribute('data-provider') || '',
          element.textContent || '',
        ].join(' ').trim().toLowerCase();
        const isAppleOAuth = href.toLowerCase().includes('/oauth/') &&
          href.toLowerCase().includes('apple');
        const isAppleLabel = /(^|\\s)(apple|애플)(로 시작하기)?($|\\s)/i.test(label);

        if (isAppleOAuth || isAppleLabel) {
          element.setAttribute('data-gachigacha-android-apple-login', '');
        }
      });
    };

    const defaultProfileImage = ${serializeForInlineScript(DEFAULT_PROFILE_IMAGE_DATA_URI)};
    const useDefaultProfileImage = (image, container) => {
      if (!(image instanceof HTMLImageElement)) return;
      if (image.dataset.gachigachaAndroidAvatarFallbackImage !== undefined) {
        return;
      }

      image.dataset.gachigachaAndroidAvatarFallbackImage = '';
      container?.setAttribute('data-gachigacha-android-avatar-fallback', '');
      image.removeAttribute('srcset');
      image.src = defaultProfileImage;
    };

    const watchProfileImage = (image, container = image) => {
      if (!(image instanceof HTMLImageElement)) return;

      image.setAttribute('data-gachigacha-android-avatar-image', '');
      if (image.dataset.gachigachaAndroidAvatarListener === undefined) {
        image.dataset.gachigachaAndroidAvatarListener = '';
        image.addEventListener('error', () => {
          useDefaultProfileImage(image, container);
        });
        image.addEventListener('load', () => {
          if (
            image.dataset.gachigachaAndroidAvatarFallbackImage === undefined &&
            image.naturalWidth > 0
          ) {
            container?.removeAttribute(
              'data-gachigacha-android-avatar-fallback',
            );
          }
        });
      }

      if (image.complete && image.naturalWidth === 0) {
        useDefaultProfileImage(image, container);
      }
    };

    const markProfileImages = () => {
      const accountLink = document.querySelector('a[aria-label="마이페이지"]');
      const accountImage = accountLink?.querySelector('img');
      if (accountImage) {
        watchProfileImage(accountImage, accountLink);
      }

      const profileEditButton = Array.from(
        document.querySelectorAll('button'),
      ).find((button) => button.textContent?.trim() === '프로필 수정');
      const profileIdentity = profileEditButton?.previousElementSibling;
      const myProfileAvatar = profileIdentity?.firstElementChild;
      if (myProfileAvatar) {
        const profileImage = myProfileAvatar.matches('img')
          ? myProfileAvatar
          : myProfileAvatar.querySelector('img');

        if (profileImage) {
          watchProfileImage(profileImage, myProfileAvatar);
        } else {
          myProfileAvatar.setAttribute(
            'data-gachigacha-android-avatar-fallback',
            '',
          );
        }
      }

      document
        .querySelectorAll(
          'img[alt="현재 프로필 사진"], img[alt="새 프로필 사진 미리보기"]',
        )
        .forEach((image) => watchProfileImage(image));
    };

    const findHeadingByText = (text) =>
      Array.from(document.querySelectorAll('h1, h2')).find(
        (heading) => heading.textContent?.trim() === text,
      );

    const markChatPresentation = () => {
      if (!window.location.pathname.startsWith('/chat')) return;

      const conversationHeading = findHeadingByText('전체 대화');
      const conversationList = conversationHeading?.closest('aside');
      const chatMain = conversationList?.parentElement;

      if (conversationList) {
        conversationList.setAttribute(
          'data-gachigacha-android-chat-list',
          '',
        );
        conversationList.querySelectorAll('button').forEach((button) => {
          const avatar = button.firstElementChild;
          if (!avatar) return;

          const image = avatar.querySelector('img');
          if (image) {
            watchProfileImage(image, avatar);
          } else {
            avatar.setAttribute(
              'data-gachigacha-android-avatar-fallback',
              '',
            );
          }
        });
      }

      if (chatMain?.tagName === 'MAIN') {
        chatMain.setAttribute('data-gachigacha-android-chat-main', '');
        const chatTop = Math.max(chatMain.getBoundingClientRect().top, 0);
        const availableHeight = Math.floor(window.innerHeight - chatTop - 12);
        if (availableHeight >= 360) {
          chatMain.style.setProperty(
            '--gachigacha-android-chat-height',
            availableHeight + 'px',
          );
        }
      }

      const composer = document.querySelector(
        'form[aria-label="메시지 입력 영역"]',
      );
      const chatRoom = composer?.closest('section');
      if (chatRoom) {
        chatRoom.setAttribute('data-gachigacha-android-chat-room', '');
        const chatSurface = chatRoom.parentElement;
        if (chatSurface?.tagName === 'ASIDE' && chatSurface !== conversationList) {
          chatSurface.setAttribute(
            'data-gachigacha-android-chat-drawer',
            '',
          );
        }
      }
      if (composer) {
        composer.setAttribute('data-gachigacha-android-chat-composer', '');
        composer.parentElement?.setAttribute(
          'data-gachigacha-android-chat-composer-area',
          '',
        );
      }
    };

    const markMapOverlays = () => {
      const resultsSection = document.querySelector(
        'section[aria-label="홍대 가챠 매장"], section[aria-label="가챠 보유 매장 검색 결과"]',
      );
      if (!resultsSection) return;

      const selectedGacha = resultsSection.querySelector(
        'section[aria-label^="선택한 가챠"]',
      );
      const serviceAreaNotice = Array.from(
        resultsSection.querySelectorAll('aside'),
      ).find((element) =>
        element.textContent?.includes('현재 지원 지역'),
      );
      let mapHeader = selectedGacha || serviceAreaNotice;
      while (mapHeader && mapHeader.parentElement !== resultsSection) {
        mapHeader = mapHeader.parentElement;
      }
      mapHeader?.setAttribute('data-gachigacha-android-map-header', '');

      const map = resultsSection.querySelector(
        'section[aria-label="검색된 가챠 보유 매장 지도"], section[aria-label="홍대 가챠 매장 지도"]',
      );
      if (!map) return;

      const researchButton = Array.from(
        map.parentElement?.querySelectorAll('button') || [],
      ).find((button) => button.textContent?.includes('이 지역에서 재검색'));
      researchButton?.setAttribute('data-gachigacha-android-map-research', '');

      const locationButton = map.querySelector(
        'button[aria-label^="현재 위치"]',
      );
      const mapControls = locationButton?.parentElement;
      mapControls?.setAttribute('data-gachigacha-android-map-controls', '');
      mapControls
        ?.querySelector('p[role="alert"]')
        ?.setAttribute('data-gachigacha-android-location-error', '');

      const storeListTitle = document.getElementById('search-store-list-title');
      const mapStatus = storeListTitle?.parentElement?.parentElement;
      mapStatus?.setAttribute(
        'data-gachigacha-android-map-status',
        '',
      );
      storeListTitle
        ?.closest('section')
        ?.parentElement?.setAttribute(
          'data-gachigacha-android-map-list-area',
          '',
        );

      const mapRect = map.getBoundingClientRect();
      const headerRect = mapHeader?.getBoundingClientRect();
      if (researchButton && headerRect && headerRect.height > 0) {
        const researchTop = Math.max(
          12,
          Math.round(headerRect.bottom - mapRect.top + 10),
        );
        researchButton.style.setProperty(
          '--gachigacha-android-map-research-top',
          researchTop + 'px',
        );
      }

      const statusRect = mapStatus?.getBoundingClientRect();
      if (mapControls && statusRect && statusRect.height > 0) {
        const controlsBottom = Math.max(
          12,
          Math.round(mapRect.bottom - statusRect.top + 10),
        );
        mapControls.style.setProperty(
          '--gachigacha-android-map-controls-bottom',
          controlsBottom + 'px',
        );
      }
    };

    const applyAndroidPresentation = () => {
      installAndroidStyle();
      markAppleLogin();
      markProfileImages();
      markChatPresentation();
      markMapOverlays();
    };

    let presentationFrame = null;
    const scheduleAndroidPresentation = () => {
      if (presentationFrame !== null) return;

      presentationFrame = window.requestAnimationFrame(() => {
        presentationFrame = null;
        applyAndroidPresentation();
      });
    };

    applyAndroidPresentation();
    document.addEventListener('DOMContentLoaded', scheduleAndroidPresentation, {
      once: true,
    });

    if (!window.__gachigachaAndroidPresentationObserverInstalled) {
      window.__gachigachaAndroidPresentationObserverInstalled = true;
      new MutationObserver(scheduleAndroidPresentation).observe(
        document.documentElement,
        { childList: true, subtree: true },
      );
      window.addEventListener('resize', scheduleAndroidPresentation);
      window.visualViewport?.addEventListener(
        'resize',
        scheduleAndroidPresentation,
      );
    }
  `;
}

/**
 * Android에서 지원하지 않는 Apple 로그인을 숨기고, SecureStore 세션을 웹 세션에
 * 복원한다. 스크립트는 GachiGacha의 허용된 HTTPS origin에만 주입한다.
 */
export function createWebShellBootstrapScript(tokens: AuthTokens | null): string {
  return `
    (() => {
      try {
        ${createTokenStorageScript(tokens)}
        ${createWebShellRuntimeBody()}
      } catch {}
    })();
    true;
  `;
}

/**
 * document-start 주입이 누락되더라도 현재 웹 저장소를 네이티브 세션과 비교한다.
 * 실제 값이 다를 때만 다시 로드하므로 onLoadEnd마다 안전하게 실행할 수 있다.
 */
export function createWebShellSessionSyncScript(
  tokens: AuthTokens | null,
): string {
  return `
    (() => {
      try {
        ${createTokenStorageSyncScript(tokens)}
        if (sessionChanged) {
          window.location.reload();
        }
      } catch {}
    })();
    true;
  `;
}

/** document-end에서도 Apple 로그인과 지도 보정을 다시 적용한다. */
export function createWebShellRuntimeScript(): string {
  return `
    (() => {
      try {
        ${createWebShellRuntimeBody()}
      } catch {}
    })();
    true;
  `;
}
