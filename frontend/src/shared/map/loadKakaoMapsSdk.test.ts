import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

type KakaoGlobal = { kakao?: unknown; __KAKAO_MAP_KEY__: string };

const testGlobal = globalThis as unknown as KakaoGlobal;

// autoload=false인 실제 SDK처럼, services는 maps.load() 이후에만 생긴다.
function simulateKakaoSdkScriptLoad(script: HTMLScriptElement) {
  const maps: { services?: object; load: (callback: () => void) => void } = {
    load: (callback) => {
      maps.services = {};
      callback();
    },
  };

  testGlobal.kakao = { maps };
  script.dispatchEvent(new Event('load'));
}

describe('loadKakaoMapsSdk', () => {
  beforeEach(() => {
    testGlobal.__KAKAO_MAP_KEY__ = 'test-kakao-key';
  });

  afterEach(() => {
    delete testGlobal.kakao;
    testGlobal.__KAKAO_MAP_KEY__ = '';
    document.getElementById('kakao-maps-sdk')?.remove();
  });

  it('autoload=false로 불러온 뒤 maps.load()를 거쳐 services까지 준비한다', async () => {
    const { loadKakaoMapsSdk } = await import('./loadKakaoMapsSdk');
    const appendChild = jest.spyOn(document.head, 'appendChild');

    const loading = loadKakaoMapsSdk();
    const script = appendChild.mock.calls[0]?.[0] as HTMLScriptElement;

    expect(script.src).toContain('autoload=false');
    expect(script.src).toContain('libraries=services');

    simulateKakaoSdkScriptLoad(script);

    await expect(loading).resolves.toBeUndefined();
    appendChild.mockRestore();
  });
});
