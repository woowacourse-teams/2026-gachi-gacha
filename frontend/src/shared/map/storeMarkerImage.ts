/** 캡슐 원의 중심과 반지름을 정의하는 도안 좌표입니다. */
const CENTER_X = 20;
const CENTER_Y = 28;
const RADIUS = 17;
const OUTLINE_WIDTH = 1.4;
const EDGE = OUTLINE_WIDTH / 2;

/** 화면에 표시할 닫힌 캡슐의 지름입니다. */
const CAPSULE_RENDER_DIAMETER = 24;
const SCALE = CAPSULE_RENDER_DIAMETER / (RADIUS * 2);

/** 캡슐의 결합선이 원과 만나는 두 점입니다. */
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
  defs: string;
  body: string;
}

export interface StoreMarkerImage {
  src: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  hitShape: 'circle';
  hitCoords: string;
}

const SEAM_BAND = `<g transform="rotate(-14 20 28)"><rect x="-40" y="29" width="120" height="4" fill="${GLASS}" opacity=".5"/></g>`;
const HIGHLIGHT = `<path d="M 8.22 21.20 A 13.6 13.6 0 0 1 18.81 14.45" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`;
const BALL_PATH = `M ${CENTER_X} ${CENTER_Y - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER_X - 0.01} ${CENTER_Y - RADIUS} Z`;

const CLOSED_MARKER_ART: MarkerArt = {
  viewBox: {
    x: CENTER_X - RADIUS - EDGE,
    y: CENTER_Y - RADIUS - EDGE,
    width: (RADIUS + EDGE) * 2,
    height: (RADIUS + EDGE) * 2,
  },
  defs: `<clipPath id="closed-capsule"><path d="${BALL_PATH}"/></clipPath>`,
  body: `<g clip-path="url(#closed-capsule)">
  <rect x="-40" y="-60" width="120" height="180" fill="${ORANGE}"/>
  <g transform="rotate(-14 20 28)"><rect x="-40" y="-51" width="120" height="80" fill="${GLASS}"/></g>
  ${SEAM_BAND}
</g>
${HIGHLIGHT}
<path d="${BALL_PATH}" fill="none" stroke="${OUTLINE}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>`,
};

const BOWL_PATH = `M ${SEAM_RIGHT} A ${RADIUS} ${RADIUS} 0 0 1 ${SEAM_LEFT} Z`;
const LID_PATH = `M ${SEAM_LEFT} A ${RADIUS} ${RADIUS} 0 1 1 ${SEAM_RIGHT} Z`;

const SELECTED_MARKER_ART: MarkerArt = {
  viewBox: {
    x: CENTER_X - RADIUS - EDGE,
    y: -2.44,
    width: 38.09,
    height: 48.14,
  },
  defs: `<clipPath id="selected-bowl"><path d="${BOWL_PATH}"/></clipPath>
<clipPath id="selected-lid"><path d="${LID_PATH}"/></clipPath>`,
  body: `<g clip-path="url(#selected-bowl)">
  <rect x="-40" y="-60" width="120" height="180" fill="${ORANGE}"/>
  ${SEAM_BAND}
</g>
<path d="${BOWL_PATH}" fill="none" stroke="${OUTLINE}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>
<g transform="rotate(45 ${SEAM_RIGHT})">
  <path d="${LID_PATH}" fill="${GLASS}" stroke="${OUTLINE}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>
  <g clip-path="url(#selected-lid)">${HIGHLIGHT}</g>
</g>`,
};

function createMarkerDataUrl({ viewBox, defs, body }: MarkerArt): string {
  const { x, y, width, height } = viewBox;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}">` +
    `<defs>${defs}</defs>${body}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function createStoreMarkerImage(art: MarkerArt): StoreMarkerImage {
  const { viewBox } = art;
  const anchorX = (CENTER_X - viewBox.x) * SCALE;
  const anchorY = (CENTER_Y - viewBox.y) * SCALE;

  return {
    src: createMarkerDataUrl(art),
    width: viewBox.width * SCALE,
    height: viewBox.height * SCALE,
    anchorX,
    anchorY,
    hitShape: 'circle',
    hitCoords: `${round(anchorX)},${round(anchorY)},${round((RADIUS + EDGE) * SCALE)}`,
  };
}

export const STORE_MARKER_IMAGE = {
  default: createStoreMarkerImage(CLOSED_MARKER_ART),
  selected: createStoreMarkerImage(SELECTED_MARKER_ART),
} as const;
