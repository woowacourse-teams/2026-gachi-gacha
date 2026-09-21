import gukjeElectronicsCenterMarker from '../assets/gukjeElectronicsCenter.webp';

/**
 * 가챠샵이 여러 층에 몰려 있는 건물.
 *
 * 국제전자센터 한 곳에 가챠샵이 70곳 넘게 있고, 모두 건물 좌표 하나를 공유한다.
 * 그대로 두면 같은 자리에 마커 70개가 포개져서 맨 위 하나 말고는 누를 수 없다.
 * 건물을 마커 하나로 묶어 그 겹침을 없앤다.
 */

/**
 * 마커 그림과 그 치수.
 *
 * 건물마다 따로 둔다. 그림 옆면에 건물 이름이 그려져 있어서 다른 건물에
 * 돌려 쓸 수 없다. 건물이 늘면 그림도 한 장씩 새로 그려야 한다.
 *
 * 매장 마커(`components/kakaoMap/markerIcon.ts`)는 SVG 도안을 data URL 로
 * 만들어 쓴다. 캡슐은 원과 호 몇 개라 그렇게 그릴 수 있다. 건물은 입체
 * 일러스트라 손으로 적을 수 있는 도형이 아니어서 여기서만 이미지를 쓴다.
 * 지웠던 스프라이트로 돌아가는 게 아니라, DPR 별로 세 벌이 아니라 @3x 한
 * 장만 두고 브라우저가 줄이게 한다.
 */
export interface BuildingMarkerArt {
  src: string;
  /** 표시 크기 (CSS px) */
  width: number;
  height: number;
  /**
   * 이미지 좌상단 기준 기준점.
   *
   * 바닥판의 한가운데가 좌표에 꽂힌다. 바닥판 아래 꼭짓점에 맞추면 건물
   * 전체가 실제 위치보다 위로 떠서, 매장 마커가 캡슐 중앙을 좌표에 꽂는
   * 것과도 어긋난다. 입체 그림이라 바닥판이 가장 넓어지는 줄이 그 중앙이다.
   */
  anchorX: number;
  anchorY: number;
  /**
   * 클릭이 먹는 사각형 `left,top,right,bottom`.
   *
   * 그림 전체를 열어두면 투명한 모서리에서도 눌려서, 옆에 있는 매장 마커를
   * 누르기 어려워진다. 위쪽은 핀과 반짝임이라 빼고 건물 몸통만 잡는다.
   * HTML `<area>`와 같은 규칙이다.
   */
  hitCoords: string;
}

export interface GachaBuilding {
  buildingId: string;
  name: string;
  latitude: number;
  longitude: number;
  marker: BuildingMarkerArt;
}

export const GACHA_BUILDINGS: readonly GachaBuilding[] = [
  {
    buildingId: 'gukje-electronics-center',
    name: '국제전자센터',
    latitude: 37.484742019735,
    longitude: 127.01776766049,
    // 아래 수치는 원본 그림(298x349)에서 잰 값이다. 그림을 갈아끼우면 다시 재야 한다.
    marker: {
      src: gukjeElectronicsCenterMarker,
      width: 99.4,
      height: 116.4,
      anchorX: 47.6,
      anchorY: 86.6,
      hitCoords: '0,34,95,112',
    },
  },
] as const;

/**
 * 건물 소속으로 볼 반경 (m).
 *
 * 좁으면 같은 건물 매장이 개별 마커로 남아 겹침이 그대로다. 넓으면 길 건너
 * 매장까지 건물이 삼켜서 지도에서 사라진다. 국제전자센터 한 동이 가로로 약
 * 90m라, 중심에서 모서리까지를 덮고 조금 넉넉한 값으로 둔다.
 */
const BUILDING_RADIUS_METERS = 60;

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

/**
 * 매장이 어느 건물에 속하는지 좌표로 판단한다. 속한 건물이 없으면 `null`.
 *
 * 임시 방편이다. 서버 응답(`NearbyStore`)에 건물을 가리키는 필드가 없어서,
 * 지금은 건물 좌표에서 반경 안에 들면 그 건물 소속으로 본다. 좌표가 비슷한
 * 이웃 건물 매장까지 삼킬 수 있는 방식이라, 서버가 건물 식별자를 내려주면
 * 이 함수는 지우고 그 값을 쓴다.
 */
export function findBuildingOf(store: {
  latitude: number;
  longitude: number;
}): GachaBuilding | null {
  return (
    GACHA_BUILDINGS.find(
      (building) =>
        getDistanceMeters(building, store) <= BUILDING_RADIUS_METERS,
    ) ?? null
  );
}
