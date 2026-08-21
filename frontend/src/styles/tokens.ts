/**
 * 화면에 쓰는 값은 여기서만 정한다.
 *
 * 컴포넌트에 직접 적으면 비슷하지만 다른 값이 계속 늘어난다. 실제로 상세 시트
 * 하나에 색 120종, 글자 크기 11종, 모서리 10종이 쌓여 있었다.
 */

/**
 * 중립색은 순회색이 아니라 accent 쪽으로 아주 살짝 기울여 둔다. 순회색은
 * 분홍 계열 배경 위에서 탁해 보인다.
 */
export const color = {
  /** 제목과 값처럼 먼저 읽어야 하는 글자 */
  ink: '#2b2528',
  /** 본문 */
  ink2: '#6f6469',
  /** 라벨, 보조 설명, 비활성 */
  ink3: '#9a9095',
  /** 구분선과 테두리 */
  line: '#eeeaec',
  /** 기본 바닥 */
  surface: '#ffffff',
  /** 한 단계 눌러 앉은 바닥 (이미지 자리, 칩) */
  surface2: '#faf7f8',
  /** 강조 */
  accent: '#963c5d',
  /** 강조 바탕 */
  accentBg: '#fce9ef',
} as const;

/**
 * 브랜드 색은 위 팔레트 밖이다. 인스타그램·카카오는 정해진 색을 그대로 써야
 * 알아보기 때문에 우리가 고를 수 있는 값이 아니다.
 */
export const brandColor = {
  instagram: 'linear-gradient(135deg, #6c45d7, #d83c72 55%, #f1a13f)',
  kakao: '#fee500',
  kakaoInk: '#251c1c',
} as const;

/** 반투명이 필요한 곳은 팔레트 색을 섞어 쓴다. 새 색을 만들지 않는다. */
export const alpha = (token: string, percent: number) =>
  `color-mix(in srgb, ${token} ${percent}%, transparent)`;

export const fontSize = {
  /** 라벨, 캡션 */
  sm: '13px',
  /** 본문 */
  md: '15px',
  /** 섹션 제목 */
  lg: '17px',
  /** 매장 이름 */
  xl: '22px',
} as const;

/** 400과 700만 쓴다. IBM Plex Sans KR 이 이 둘만 로드하고, 그 사이 값은 브라우저가 700으로 반올림한다. */
export const fontWeight = {
  regular: 400,
  bold: 700,
} as const;

export const radius = {
  /** 작은 조각 */
  sm: '8px',
  /** 카드, 이미지 */
  md: '14px',
  /** 시트 윗변 */
  lg: '24px',
  pill: '999px',
  circle: '50%',
} as const;

/** 간격은 4의 배수만 쓴다. */
export const space = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
} as const;

export const shadow = {
  sheet: `0 -8px 36px ${alpha(color.ink, 14)}`,
  float: `0 2px 10px ${alpha(color.ink, 16)}`,
} as const;

/** 키보드 포커스 표시. 모든 누를 수 있는 요소가 같은 모양을 쓴다. */
export const focusRing = `3px solid ${alpha(color.accent, 32)}`;
