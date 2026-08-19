import type { LatLngLiteral } from './useKakaoMap';

interface RevealOptions {
  /** 화면 아래쪽이 무언가에 덮여 있는 높이 (px). 바텀시트 높이가 여기 들어온다. */
  coveredHeight: number;
  /** 가림막 윗변에서 이만큼 위에 좌표를 놓는다. 클수록 지도가 많이 움직인다. */
  gap?: number;
  /** 좌표가 화면 위 가장자리에 딱 붙지 않도록 남겨두는 여백 (px) */
  margin?: number;
}

/**
 * 가림막 윗변 바로 위에 붙인다. 남은 영역의 한가운데에 두면 지도가 필요 이상으로
 * 많이 움직여서, 눌렀던 자리가 어디였는지 놓치기 쉽다.
 *
 * 32px 는 마커 아래 절반(12.5px)을 빼고도 20px 정도가 남는 값이다.
 */
const DEFAULT_GAP = 32;
const DEFAULT_MARGIN = 24;

/**
 * 좌표가 화면 아래쪽 가림막에 덮여 있으면, 가림막 바로 위로 오도록 지도를 옮긴다.
 *
 * 이미 잘 보이는 위치면 아무것도 하지 않는다. 매번 옮기면 가려지지도 않은 마커까지
 * 화면이 출렁여서 어지럽다.
 */
export function revealPosition(
  map: kakao.maps.Map,
  position: LatLngLiteral,
  { coveredHeight, gap = DEFAULT_GAP, margin = DEFAULT_MARGIN }: RevealOptions,
) {
  const { maps } = window.kakao;
  const height = map.getNode().clientHeight;
  const visibleHeight = height - coveredHeight;

  // 가림막이 화면을 거의 다 덮으면 어디로 옮겨도 소용없다.
  if (visibleHeight < margin * 2) return;

  const projection = map.getProjection();
  const centerPoint = projection.pointFromCoords(map.getCenter());
  const targetPoint = projection.pointFromCoords(
    new maps.LatLng(position.lat, position.lng),
  );

  // 지도 컨테이너 기준으로 이 좌표가 지금 몇 px 높이에 있는지
  const screenY = height / 2 + (targetPoint.y - centerPoint.y);

  if (screenY >= margin && screenY <= visibleHeight - margin) return;

  const targetY = Math.max(margin, visibleHeight - gap);

  // 화면에서 위로 (screenY - 목표) 만큼 올리려면 중심을 같은 만큼 내린다.
  const shift = screenY - targetY;
  const nextCenter = projection.coordsFromPoint(
    new maps.Point(centerPoint.x, centerPoint.y + shift),
  );

  map.panTo(nextCenter);
}
