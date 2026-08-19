/**
 * 지도 마커 아이콘.
 *
 * 도안을 SVG로 들고 있다가 data URL로 만들어 `MarkerImage`에 넘긴다.
 * PNG 스프라이트를 DPR별로 세 벌 관리하던 방식을 대체한다.
 *
 * - 문자열은 모듈 로드 시 한 번만 만든다. 같은 문자열이면 브라우저가 디코드
 *   결과를 재사용하므로, 마커가 몇 개든 실제 래스터는 상태당 한 번이다.
 * - 두 상태의 배율과 기준점은 아래 상수에서 계산한다. 손으로 맞추면
 *   선택할 때 마커가 튄다.
 */

/** 도안의 기준 배율. 닫힘 상태의 viewBox 40.8단위를 40px로 그린다. */
const BASE_VIEWBOX_WIDTH = 40.8;
const BASE_RENDER_WIDTH = 40;
const SCALE = BASE_RENDER_WIDTH / BASE_VIEWBOX_WIDTH;

/** 두 상태가 공유하는 기준점 (도안 좌표계). 그릇의 중심축과 지면에 닿는 높이. */
const CENTER_X = 20;
const GROUND_Y = 51.5;

/**
 * 뚜껑이 맞물리는 선(씰)이 반지름 17 원과 만나는 두 점.
 *
 * 소수 둘째 자리로 반올림하면 안 된다. 이 현의 길이가 지름에 거의 닿아 있어서,
 * 끝점이 0.01만 어긋나도 SVG가 역산하는 원의 중심이 0.2 넘게 밀린다.
 * 그러면 선택 상태의 그릇만 옆으로 미끄러져서 마커가 눌릴 때 흔들린다.
 *
 * 유도: 중심 (20, 28), 반지름 17 원에서 중심보다 1 아래를 지나는 현의 두 끝점
 *       (20 ± √(17² − 1²), 29) 을 중심 기준 -14도 회전시킨 값.
 *       두 점 모두 중심에서 거리가 정확히 17이어야 한다.
 */
const SEAM_RIGHT = '36.7084 24.8647';
const SEAM_LEFT = '3.7755 33.0758';

const ORANGE = '#D85A30';
const GLASS = '#DCE9F2';
const OUTLINE = '#111';

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MarkerArt {
  viewBox: ViewBox;
  /** 상태마다 쓰는 defs만 담는다. 안 쓰는 clipPath를 넣으면 문자열만 길어진다. */
  defs: string;
  body: string;
}

const SHADOW_GRADIENT = `<radialGradient id="s">
  <stop offset="0%" stop-color="${OUTLINE}" stop-opacity=".24"/>
  <stop offset="55%" stop-color="${OUTLINE}" stop-opacity=".149"/>
  <stop offset="100%" stop-color="${OUTLINE}" stop-opacity="0"/>
</radialGradient>`;

const SHADOW = `<ellipse cx="${CENTER_X}" cy="${GROUND_Y}" rx="7.4" ry="2.5" fill="url(#s)"/>`;

/** 그릇 위쪽에 걸치는 반투명 띠. 뚜껑이 맞물린 자리를 표현한다. */
const SEAM_BAND = `<g transform="rotate(-14 20 28)"><rect x="-40" y="29" width="120" height="4" fill="${GLASS}" opacity=".5"/></g>`;

/** 유리 뚜껑의 하이라이트 호. */
const HIGHLIGHT = `<path d="M 8.22 21.20 A 13.6 13.6 0 0 1 18.81 14.45" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`;

const CLOSED: MarkerArt = {
  viewBox: { x: -0.4, y: 9, width: 40.8, height: 47.7 },
  defs: `${SHADOW_GRADIENT}
<clipPath id="a"><path d="M 20 11 A 17 17 0 1 1 19.99 11 Z"/></clipPath>`,
  body: `${SHADOW}
<g clip-path="url(#a)">
  <rect x="-40" y="-60" width="120" height="180" fill="${ORANGE}"/>
  <g transform="rotate(-14 20 28)"><rect x="-40" y="-51" width="120" height="80" fill="${GLASS}"/></g>
  ${SEAM_BAND}
</g>
${HIGHLIGHT}
<path d="M 20 11 A 17 17 0 1 1 19.99 11 Z" fill="none" stroke="${OUTLINE}" stroke-width="1.4" stroke-linejoin="round"/>`,
};

/** 씰 아래쪽 반원 = 그릇, 위쪽 반원 = 뚜껑. 둘 다 같은 원 위에 있다. */
const BOWL_PATH = `M ${SEAM_RIGHT} A 17 17 0 0 1 ${SEAM_LEFT} Z`;
const LID_PATH = `M ${SEAM_LEFT} A 17 17 0 1 1 ${SEAM_RIGHT} Z`;

const SELECTED: MarkerArt = {
  // 폭은 닫힘 상태와 같다. 뚜껑을 45도 젖혀도 원래 폭을 넘지 않는다.
  viewBox: { x: -0.4, y: -2.44, width: 40.8, height: 59.14 },
  defs: `${SHADOW_GRADIENT}
<clipPath id="b"><path d="${BOWL_PATH}"/></clipPath>
<clipPath id="c"><path d="${LID_PATH}"/></clipPath>`,
  body: `${SHADOW}
<g clip-path="url(#b)">
  <rect x="-40" y="-60" width="120" height="180" fill="${ORANGE}"/>
  ${SEAM_BAND}
</g>
<path d="${BOWL_PATH}" fill="none" stroke="${OUTLINE}" stroke-width="1.4" stroke-linejoin="round"/>
<g transform="rotate(45 ${SEAM_RIGHT})">
  <path d="${LID_PATH}" fill="${GLASS}" stroke="${OUTLINE}" stroke-width="1.4" stroke-linejoin="round"/>
  <g clip-path="url(#c)">${HIGHLIGHT}</g>
</g>`,
};

export interface MarkerIcon {
  /** `MarkerImage`의 src로 넘길 data URL */
  src: string;
  /** 표시 크기 (CSS px) */
  width: number;
  height: number;
  /** 이미지 좌상단 기준 기준점. 이 점이 좌표에 꽂힌다. */
  anchorX: number;
  anchorY: number;
}

function toDataUrl({ viewBox, defs, body }: MarkerArt) {
  const { x, y, width, height } = viewBox;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}">` +
    `<defs>${defs}</defs>${body}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function toIcon(art: MarkerArt): MarkerIcon {
  const { viewBox } = art;

  return {
    src: toDataUrl(art),
    width: viewBox.width * SCALE,
    height: viewBox.height * SCALE,
    anchorX: (CENTER_X - viewBox.x) * SCALE,
    anchorY: (GROUND_Y - viewBox.y) * SCALE,
  };
}

export const MARKER_ICON = {
  default: toIcon(CLOSED),
  selected: toIcon(SELECTED),
} as const;
