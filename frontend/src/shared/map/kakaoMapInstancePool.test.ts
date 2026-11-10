import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  acquireKakaoMap,
  resetSharedKakaoMapForTest,
} from './kakaoMapInstancePool';

const CENTER = { latitude: 37.5563, longitude: 126.9236 };
const OTHER_CENTER = { latitude: 37.4979, longitude: 127.0276 };

class MockLatLng {
  constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}
}

const MockMap = jest.fn(function (this: Record<string, unknown>) {
  this.relayout = jest.fn();
  this.setLevel = jest.fn();
  this.setCenter = jest.fn();
});

function createHost(): HTMLDivElement {
  const host = document.createElement('div');

  document.body.appendChild(host);

  return host;
}

describe('카카오맵 인스턴스 재사용', () => {
  beforeEach(() => {
    window.kakao = {
      maps: { LatLng: MockLatLng, Map: MockMap },
    } as unknown as typeof kakao;
  });

  afterEach(() => {
    resetSharedKakaoMapForTest();
    MockMap.mockClear();
    document.body.replaceChildren();
    delete window.kakao;
  });

  it('지도 화면에 다시 들어와도 새 지도를 만들지 않고 기존 지도를 재사용한다', () => {
    const firstHost = createHost();
    const first = acquireKakaoMap(firstHost, { center: CENTER, level: 4 });

    first.release();

    const secondHost = createHost();
    const second = acquireKakaoMap(secondHost, { center: CENTER, level: 4 });

    expect(MockMap).toHaveBeenCalledTimes(1);
    expect(second.map).toBe(first.map);
    expect(firstHost.childElementCount).toBe(0);
    expect(secondHost.childElementCount).toBe(1);
  });

  it('재사용할 때 요청한 중심 좌표와 레벨로 지도를 맞춘다', () => {
    acquireKakaoMap(createHost(), { center: CENTER, level: 4 }).release();

    const { map } = acquireKakaoMap(createHost(), {
      center: OTHER_CENTER,
      level: 6,
    });

    expect(map.relayout).toHaveBeenCalled();
    expect(map.setLevel).toHaveBeenCalledWith(6);
    expect(map.setCenter).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: OTHER_CENTER.latitude,
        longitude: OTHER_CENTER.longitude,
      }),
    );
  });

  it('공유 지도가 사용 중이면 별도 지도를 만든다', () => {
    const first = acquireKakaoMap(createHost(), { center: CENTER, level: 4 });
    const second = acquireKakaoMap(createHost(), { center: CENTER, level: 4 });

    expect(MockMap).toHaveBeenCalledTimes(2);
    expect(second.map).not.toBe(first.map);
  });

  it('SDK가 없으면 오류를 던진다', () => {
    delete window.kakao;

    expect(() =>
      acquireKakaoMap(createHost(), { center: CENTER, level: 4 }),
    ).toThrow('지도를 불러오지 못했습니다.');
  });
});
