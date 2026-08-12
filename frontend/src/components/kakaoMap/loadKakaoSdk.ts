const SDK_SCRIPT_ID = 'kakao-map-sdk';
const SDK_TIMEOUT_MS = 10_000;
const SDK_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${__KAKAO_MAP_KEY__}&autoload=false`;

let sdkPromise: Promise<void> | null = null;

function appendSdkScript() {
  return new Promise<void>((resolve, reject) => {
    document.getElementById(SDK_SCRIPT_ID)?.remove();

    const script = document.createElement('script');

    script.id = SDK_SCRIPT_ID;
    script.src = SDK_SRC;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('kakao-sdk/load-failed')),
      { once: true },
    );

    document.head.appendChild(script);
  });
}

function withTimeout(task: Promise<void>) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('kakao-sdk/timeout'));
    }, SDK_TIMEOUT_MS);

    task.then(resolve, reject).finally(() => window.clearTimeout(timeoutId));
  });
}

async function resolveKakaoSdk() {
  if (!window.kakao?.maps) {
    await appendSdkScript();
  }

  if (!window.kakao?.maps) {
    throw new Error('kakao-sdk/load-failed');
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
