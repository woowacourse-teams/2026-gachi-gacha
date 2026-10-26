import { completeAppleLogin } from './api/completeAppleLogin';
import { prepareAppleLogin } from './api/prepareAppleLogin';
import type { AuthTokens } from './authTokensType';

const APPLE_SIGN_IN_SCRIPT_ID = 'apple-sign-in-sdk';
const APPLE_SIGN_IN_SCRIPT_URL =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
const APPLE_SIGN_IN_SCOPE = 'name email';
const APPLE_SIGN_IN_LOAD_TIMEOUT_MS = 10_000;

let appleSignInSdkPromise: Promise<AppleIdClient> | null = null;
let appleSignInPreparationPromise: Promise<void> | null = null;
let preparedAppleSignIn:
  | {
      client: AppleIdClient;
      preparation: Awaited<ReturnType<typeof prepareAppleLogin>>;
    }
  | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseAppleSignInResponse(value: unknown): AppleSignInResponse {
  if (!isRecord(value) || !isRecord(value.authorization)) {
    throw new Error('Apple 로그인 결과가 올바르지 않습니다.');
  }

  const { authorization } = value;
  const code = authorization.code;
  const idToken = authorization.id_token;
  const state = authorization.state;

  if (
    typeof code !== 'string' ||
    !code.trim() ||
    typeof idToken !== 'string' ||
    !idToken.trim() ||
    typeof state !== 'string' ||
    !state.trim()
  ) {
    throw new Error('Apple 로그인 인증 정보가 올바르지 않습니다.');
  }

  const user = isRecord(value.user)
    ? (value.user as AppleSignInUser)
    : undefined;

  return {
    authorization: {
      code: code.trim(),
      id_token: idToken.trim(),
      state: state.trim(),
    },
    ...(user ? { user } : {}),
  };
}

function appendAppleSignInScript(): Promise<AppleIdClient> {
  return new Promise((resolve, reject) => {
    document.getElementById(APPLE_SIGN_IN_SCRIPT_ID)?.remove();

    const script = document.createElement('script');
    const timeoutId = window.setTimeout(() => {
      script.remove();
      reject(new Error('Apple 로그인 SDK 요청 시간이 초과되었습니다.'));
    }, APPLE_SIGN_IN_LOAD_TIMEOUT_MS);

    script.id = APPLE_SIGN_IN_SCRIPT_ID;
    script.src = APPLE_SIGN_IN_SCRIPT_URL;
    script.async = true;
    script.addEventListener(
      'load',
      () => {
        window.clearTimeout(timeoutId);

        if (!window.AppleID) {
          reject(new Error('Apple 로그인 SDK를 초기화하지 못했습니다.'));
          return;
        }

        resolve(window.AppleID);
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        window.clearTimeout(timeoutId);
        reject(new Error('Apple 로그인 SDK를 불러오지 못했습니다.'));
      },
      { once: true },
    );

    document.head.appendChild(script);
  });
}

async function loadAppleSignInSdk(): Promise<AppleIdClient> {
  if (window.AppleID) {
    return window.AppleID;
  }

  appleSignInSdkPromise ??= appendAppleSignInScript().catch((cause) => {
    appleSignInSdkPromise = null;
    throw cause;
  });

  return appleSignInSdkPromise;
}

export function prepareAppleSignIn(): Promise<void> {
  if (preparedAppleSignIn) {
    return Promise.resolve();
  }

  appleSignInPreparationPromise ??= Promise.all([
    prepareAppleLogin(),
    loadAppleSignInSdk(),
  ])
    .then(([preparation, client]) => {
      client.auth.init({
        clientId: preparation.clientId,
        scope: APPLE_SIGN_IN_SCOPE,
        redirectURI: preparation.redirectUri,
        state: preparation.state,
        nonce: preparation.nonce,
        usePopup: true,
      });
      preparedAppleSignIn = { client, preparation };
    })
    .catch((cause: unknown) => {
      appleSignInPreparationPromise = null;
      throw cause;
    });

  return appleSignInPreparationPromise;
}

export async function signInWithApple(): Promise<AuthTokens> {
  const prepared = preparedAppleSignIn;

  if (!prepared) {
    throw new Error('Apple 로그인을 준비하고 있습니다.');
  }

  try {
    // 브라우저가 팝업을 사용자 클릭으로 인식하도록 첫 await 전에 호출한다.
    const signInResult = prepared.client.auth.signIn();
    const result = parseAppleSignInResponse(await signInResult);

    if (result.authorization.state !== prepared.preparation.state) {
      throw new Error('Apple 로그인 요청이 유효하지 않습니다.');
    }

    return await completeAppleLogin({
      code: result.authorization.code,
      state: result.authorization.state,
      ...(result.user ? { user: result.user } : {}),
    });
  } finally {
    preparedAppleSignIn = undefined;
    appleSignInPreparationPromise = null;
  }
}
