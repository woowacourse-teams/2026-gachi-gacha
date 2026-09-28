const KAKAO_MAPS_SCRIPT_ID = 'kakao-maps-sdk';
const KAKAO_MAPS_LOAD_TIMEOUT_MS = 10_000;

let kakaoMapsSdkPromise: Promise<void> | null = null;

function createKakaoMapsSdkUrl(): string {
  const searchParams = new URLSearchParams({
    appkey: __KAKAO_MAP_KEY__,
    autoload: 'false',
  });

  return `https://dapi.kakao.com/v2/maps/sdk.js?${searchParams}`;
}

function appendKakaoMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    document.getElementById(KAKAO_MAPS_SCRIPT_ID)?.remove();

    const script = document.createElement('script');

    script.id = KAKAO_MAPS_SCRIPT_ID;
    script.src = createKakaoMapsSdkUrl();
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')),
      { once: true },
    );

    document.head.appendChild(script);
  });
}

function withTimeout(task: Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('카카오 지도 SDK 요청 시간이 초과되었습니다.'));
    }, KAKAO_MAPS_LOAD_TIMEOUT_MS);

    task.then(resolve, reject).finally(() => window.clearTimeout(timeoutId));
  });
}

async function initializeKakaoMapsSdk(): Promise<void> {
  if (!__KAKAO_MAP_KEY__) {
    throw new Error('카카오 지도 JavaScript 키가 설정되지 않았습니다.');
  }

  if (!window.kakao?.maps) {
    await appendKakaoMapsScript();
  }

  if (!window.kakao?.maps) {
    throw new Error('카카오 지도 SDK를 초기화하지 못했습니다.');
  }

  await new Promise<void>((resolve) => window.kakao?.maps.load(resolve));
}

export function loadKakaoMapsSdk(): Promise<void> {
  kakaoMapsSdkPromise ??= withTimeout(initializeKakaoMapsSdk()).catch(
    (cause: unknown) => {
      kakaoMapsSdkPromise = null;
      throw cause;
    },
  );

  return kakaoMapsSdkPromise;
}
