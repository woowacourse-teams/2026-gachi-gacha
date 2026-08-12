const SDK_SCRIPT_ID = 'kakao-map-sdk';
const SDK_TIMEOUT_MS = 10_000;

const LOAD_FAILED_MESSAGE =
  '카카오 지도를 불러오지 못했습니다. 앱키와 네트워크 상태를 확인해주세요.';
const TIMEOUT_MESSAGE =
  '카카오 지도 응답이 없습니다. 네트워크 상태를 확인해주세요.';

let sdkPromise: Promise<void> | null = null;

function findSdkScript() {
  const element = document.getElementById(SDK_SCRIPT_ID);

  return element instanceof HTMLScriptElement ? element : null;
}

function hasScriptSettled(script: HTMLScriptElement) {
  return !script.async && !script.defer && document.readyState !== 'loading';
}

function waitForScriptLoad(script: HTMLScriptElement) {
  return new Promise<void>((resolve, reject) => {
    function cleanup() {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    }

    function handleLoad() {
      cleanup();
      resolve();
    }

    function handleError() {
      cleanup();
      reject(new Error(LOAD_FAILED_MESSAGE));
    }

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
  });
}

function withTimeout(task: Promise<void>) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(TIMEOUT_MESSAGE));
    }, SDK_TIMEOUT_MS);

    task.then(resolve, reject).finally(() => window.clearTimeout(timeoutId));
  });
}

async function resolveKakaoSdk() {
  if (!window.kakao?.maps) {
    const script = findSdkScript();

    if (!script) {
      throw new Error(
        `카카오 지도 SDK 스크립트(#${SDK_SCRIPT_ID})를 찾을 수 없습니다.`,
      );
    }

    if (hasScriptSettled(script)) {
      throw new Error(LOAD_FAILED_MESSAGE);
    }

    await waitForScriptLoad(script);
  }

  if (!window.kakao?.maps) {
    throw new Error(LOAD_FAILED_MESSAGE);
  }

  await new Promise<void>((resolve) => window.kakao.maps.load(resolve));
}

export function loadKakaoSdk(): Promise<void> {
  sdkPromise ??= withTimeout(resolveKakaoSdk()).catch((cause: unknown) => {
    sdkPromise = null;
    throw cause;
  });

  return sdkPromise;
}
