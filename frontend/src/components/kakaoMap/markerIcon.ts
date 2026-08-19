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
 * - 그림자는 넣지 않는다. 그림자가 있으면 기준점을 지면에 둬야 해서 캡슐이
 *   좌표 위쪽에 뜨고, 이미지 박스도 아래로 길어져 클릭 영역이 넓어진다.
 */

/** 캡슐 원 (도안 좌표계). 마커의 모든 치수가 여기서 나온다. */
const CENTER_X = 20;
const CENTER_Y = 28;
const RADIUS = 17;
const OUTLINE_WIDTH = 1.4;
/** 외곽선은 경로 중앙에 그려지므로 절반이 원 바깥으로 나간다. */
const EDGE = OUTLINE_WIDTH / 2;

/** 캡슐 지름을 화면에서 몇 px로 그릴지. 마커 크기는 이 값 하나가 정한다. */
const BALL_RENDER_DIAMETER = 24;
const SCALE = BALL_RENDER_DIAMETER / (RADIUS * 2);

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

/** 그릇 위쪽에 걸치는 반투명 띠. 뚜껑이 맞물린 자리를 표현한다. */
const SEAM_BAND = `<g transform="rotate(-14 20 28)"><rect x="-40" y="29" width="120" height="4" fill="${GLASS}" opacity=".5"/></g>`;

/** 유리 뚜껑의 하이라이트 호. */
const HIGHLIGHT = `<path d="M 8.22 21.20 A 13.6 13.6 0 0 1 18.81 14.45" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`;

const BALL_PATH = `M ${CENTER_X} ${CENTER_Y - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER_X - 0.01} ${CENTER_Y - RADIUS} Z`;

/** 닫힘 상태는 원에 외곽선 절반을 더한 정사각형이면 정확히 들어맞는다. */
const CLOSED: MarkerArt = {
  viewBox: {
    x: CENTER_X - RADIUS - EDGE,
    y: CENTER_Y - RADIUS - EDGE,
    width: (RADIUS + EDGE) * 2,
    height: (RADIUS + EDGE) * 2,
  },
  defs: `<clipPath id="a"><path d="${BALL_PATH}"/></clipPath>`,
  body: `<g clip-path="url(#a)">
  <rect x="-40" y="-60" width="120" height="180" fill="${ORANGE}"/>
  <g transform="rotate(-14 20 28)"><rect x="-40" y="-51" width="120" height="80" fill="${GLASS}"/></g>
  ${SEAM_BAND}
</g>
${HIGHLIGHT}
<path d="${BALL_PATH}" fill="none" stroke="${OUTLINE}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>`,
};

/** 씰 아래쪽 반원 = 그릇, 위쪽 반원 = 뚜껑. 둘 다 같은 원 위에 있다. */
const BOWL_PATH = `M ${SEAM_RIGHT} A ${RADIUS} ${RADIUS} 0 0 1 ${SEAM_LEFT} Z`;
const LID_PATH = `M ${SEAM_LEFT} A ${RADIUS} ${RADIUS} 0 1 1 ${SEAM_RIGHT} Z`;

const SELECTED: MarkerArt = {
  // 왼쪽 가장자리와 아래는 닫힘 상태와 맞춘다. 왼쪽을 맞춰야 두 상태의 anchorX가
  // 같아져서 선택할 때 마커가 좌우로 흔들리지 않는다.
  // 위와 오른쪽은 경첩 기준 45도 젖힌 뚜껑이 정한다. 원호를 촘촘히 훑어 구한
  // 값이라 식으로 적을 수 없다. 여는 각도를 바꾸면 다시 재야 한다.
  viewBox: {
    x: CENTER_X - RADIUS - EDGE,
    y: -2.44,
    width: 38.09,
    height: 48.14,
  },
  defs: `<clipPath id="b"><path d="${BOWL_PATH}"/></clipPath>
<clipPath id="c"><path d="${LID_PATH}"/></clipPath>`,
  body: `<g clip-path="url(#b)">
  <rect x="-40" y="-60" width="120" height="180" fill="${ORANGE}"/>
  ${SEAM_BAND}
</g>
<path d="${BOWL_PATH}" fill="none" stroke="${OUTLINE}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>
<g transform="rotate(45 ${SEAM_RIGHT})">
  <path d="${LID_PATH}" fill="${GLASS}" stroke="${OUTLINE}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>
  <g clip-path="url(#c)">${HIGHLIGHT}</g>
</g>`,
};

export interface MarkerIcon {
  /** `MarkerImage`의 src로 넘길 data URL */
  src: string;
  /** 표시 크기 (CSS px) */
  width: number;
  height: number;
  /** 이미지 좌상단 기준 기준점. 캡슐의 중심이 좌표에 꽂힌다. */
  anchorX: number;
  anchorY: number;
  /**
   * 클릭과 마우스오버가 먹는 영역. 캡슐 원만 잡는다.
   *
   * 이걸 지정하지 않으면 이미지의 사각형 전체가 반응한다. 그러면 원 바깥
   * 모서리에서도 클릭이 먹어서, 겹쳐 있는 다른 마커를 누르기 어려워진다.
   * `shape`/`coords`는 HTML `<area>`와 같은 규칙이다.
   */
  hitShape: 'circle';
  hitCoords: string;
}

function toDataUrl({ viewBox, defs, body }: MarkerArt) {
  const { x, y, width, height } = viewBox;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}">` +
    `<defs>${defs}</defs>${body}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function toIcon(art: MarkerArt): MarkerIcon {
  const { viewBox } = art;
  const centerX = (CENTER_X - viewBox.x) * SCALE;
  const centerY = (CENTER_Y - viewBox.y) * SCALE;

  return {
    src: toDataUrl(art),
    width: viewBox.width * SCALE,
    height: viewBox.height * SCALE,
    anchorX: centerX,
    anchorY: centerY,
    hitShape: 'circle',
    hitCoords: `${round(centerX)},${round(centerY)},${round((RADIUS + EDGE) * SCALE)}`,
  };
}

export const MARKER_ICON = {
  default: toIcon(CLOSED),
  selected: toIcon(SELECTED),
} as const;
