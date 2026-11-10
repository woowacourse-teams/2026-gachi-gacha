import type { MapCoordinate } from './mapCoordinateType';

interface KakaoMapInstanceOptions {
  center: MapCoordinate;
  level: number;
}

export interface AcquiredKakaoMap {
  map: kakao.maps.Map;
  release: () => void;
}

interface SharedKakaoMapEntry {
  map: kakao.maps.Map;
  element: HTMLDivElement;
  isInUse: boolean;
}

const SDK_NOT_LOADED_MESSAGE = '지도를 불러오지 못했습니다.';

/**
 * 카카오맵 SDK에는 지도 인스턴스를 파괴하는 API가 없다.
 * 화면에 들어올 때마다 지도를 새로 만들면 언마운트된 지도가 SDK 내부 참조로 남아
 * 메모리가 계속 쌓이고, 앱(WebView)에서는 결국 렌더러가 종료되어 흰 화면이 된다.
 * 그래서 지도는 한 번만 만들고, 화면이 바뀌면 지도 DOM만 떼었다가 다시 붙여 재사용한다.
 */
let sharedEntry: SharedKakaoMapEntry | null = null;

function createMapElement(): HTMLDivElement {
  const element = document.createElement('div');

  element.style.width = '100%';
  element.style.height = '100%';

  return element;
}

function toLatLng(maps: typeof kakao.maps, coordinate: MapCoordinate) {
  return new maps.LatLng(coordinate.latitude, coordinate.longitude);
}

function attachSharedMap(
  maps: typeof kakao.maps,
  entry: SharedKakaoMapEntry,
  host: HTMLElement,
  { center, level }: KakaoMapInstanceOptions,
): AcquiredKakaoMap {
  entry.isInUse = true;
  host.appendChild(entry.element);
  entry.map.relayout();
  entry.map.setLevel(level);
  entry.map.setCenter(toLatLng(maps, center));

  return {
    map: entry.map,
    release: () => {
      entry.element.remove();
      entry.isInUse = false;
    },
  };
}

/**
 * 공유 지도를 host 안에 붙여서 반환한다.
 * 공유 지도를 이미 다른 화면이 쓰고 있으면(예: 스토리북에서 지도를 동시에 여러 개 렌더)
 * 기존처럼 별도 인스턴스를 만든다.
 */
export function acquireKakaoMap(
  host: HTMLElement,
  options: KakaoMapInstanceOptions,
): AcquiredKakaoMap {
  const maps = window.kakao?.maps;

  if (!maps) {
    throw new Error(SDK_NOT_LOADED_MESSAGE);
  }

  if (sharedEntry && !sharedEntry.isInUse) {
    return attachSharedMap(maps, sharedEntry, host, options);
  }

  const element = createMapElement();

  // 지도가 컨테이너 크기를 기준으로 타일을 배치하므로, 생성 전에 DOM에 먼저 붙인다.
  host.appendChild(element);

  const map = new maps.Map(element, {
    center: toLatLng(maps, options.center),
    draggable: true,
    level: options.level,
  });

  if (!sharedEntry) {
    const entry: SharedKakaoMapEntry = { map, element, isInUse: true };

    sharedEntry = entry;

    return {
      map,
      release: () => {
        entry.element.remove();
        entry.isInUse = false;
      },
    };
  }

  return {
    map,
    release: () => {
      element.remove();
    },
  };
}

export function resetSharedKakaoMapForTest() {
  sharedEntry = null;
}
