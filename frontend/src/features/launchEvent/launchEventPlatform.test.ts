import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { getLaunchEventPlatform } from './launchEventPlatform';

const navigatorKeys = ['userAgent', 'platform', 'maxTouchPoints'] as const;
const originalNavigatorProperties = navigatorKeys.map((key) => ({
  key,
  descriptor: Object.getOwnPropertyDescriptor(navigator, key),
}));

function setDevice(userAgent: string, platform = '', maxTouchPoints = 0) {
  Object.defineProperties(navigator, {
    userAgent: { configurable: true, value: userAgent },
    platform: { configurable: true, value: platform },
    maxTouchPoints: { configurable: true, value: maxTouchPoints },
  });
}

afterEach(() => {
  delete document.documentElement.dataset.gachigachaNativePlatform;
  delete window.ReactNativeWebView;
  for (const { key, descriptor } of originalNavigatorProperties) {
    if (descriptor) Object.defineProperty(navigator, key, descriptor);
    else Reflect.deleteProperty(navigator, key);
  }
});

describe('이벤트 참여 경로', () => {
  it.each(['android', 'ios'] as const)(
    '앱이 주입한 명시적 %s 표식을 우선한다',
    (platform) => {
      document.documentElement.dataset.gachigachaNativePlatform = platform;
      setDevice(platform === 'android' ? 'iPhone' : 'Android');

      expect(getLaunchEventPlatform()).toBe(platform);
    },
  );

  it.each(['', 'ANDROID', 'unknown', '<script>ios</script>'])(
    '유효하지 않은 표식 %s만으로 앱으로 분류하지 않는다',
    (marker) => {
      document.documentElement.dataset.gachigachaNativePlatform = marker;
      setDevice('Android');

      expect(getLaunchEventPlatform()).toBe('web');
    },
  );

  it.each([
    ['Android Chrome', 'Mozilla/5.0 (Linux; Android 15) Chrome/140.0', '', 5],
    ['iPhone Safari', 'Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari', '', 5],
    [
      'iPad Safari',
      'Mozilla/5.0 (Macintosh) Version/18.0 Safari',
      'MacIntel',
      5,
    ],
    ['PC Chrome', 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0', 'Win32', 0],
  ])('브리지가 없는 %s는 웹이다', (_, userAgent, platform, touchPoints) => {
    setDevice(userAgent, platform, touchPoints);

    expect(getLaunchEventPlatform()).toBe('web');
  });

  it('postMessage가 함수가 아닌 객체를 앱 브리지로 인정하지 않는다', () => {
    Object.defineProperty(window, 'ReactNativeWebView', {
      configurable: true,
      value: { postMessage: 'not-a-function' },
    });
    setDevice('Android');

    expect(getLaunchEventPlatform()).toBe('web');
  });

  it.each([
    ['Android', 'Mozilla/5.0 (Linux; Android 15; wv)', '', 5, 'android'],
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', '', 5, 'ios'],
    ['iPad', 'Mozilla/5.0 (iPad; CPU OS 18_0)', '', 5, 'ios'],
    ['iPod', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 18_0)', '', 5, 'ios'],
    ['데스크톱 UA iPad', 'Mozilla/5.0 (Macintosh)', 'MacIntel', 5, 'ios'],
    ['미확인 OS', 'Unknown WebView', '', 0, 'app-unknown'],
    ['Mac', 'Mozilla/5.0 (Macintosh)', 'MacIntel', 0, 'app-unknown'],
  ])(
    '네이티브 브리지가 있으면 %s 환경을 구분한다',
    (_, userAgent, platform, touchPoints, expected) => {
      const postMessage = jest.fn();
      window.ReactNativeWebView = { postMessage };
      setDevice(userAgent, platform, touchPoints);

      expect(getLaunchEventPlatform()).toBe(expected);
      expect(postMessage).not.toHaveBeenCalled();
    },
  );

  it('호출할 때마다 확인하여 늦게 주입된 앱 표식도 반영한다', () => {
    expect(getLaunchEventPlatform()).toBe('web');
    document.documentElement.dataset.gachigachaNativePlatform = 'android';

    expect(getLaunchEventPlatform()).toBe('android');
  });
});
