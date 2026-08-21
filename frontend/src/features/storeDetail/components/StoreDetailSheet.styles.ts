import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

import {
  alpha,
  brandColor,
  color,
  focusRing,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/styles/tokens';

import { getBottomSheetTop } from '../model/bottomSheetState';
import type { BottomSheetState } from '../model/storeDetail';

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
`;

/* ------------------------------------------------------------------ 시트 */

export const StoryFrame = styled.div`
  position: relative;
  width: min(100vw, 430px);
  height: 100dvh;
  min-height: 720px;
  margin: 0 auto;
  overflow: hidden;
  background: ${color.surface2};
  font-family: 'IBM Plex Sans KR', sans-serif;
`;

interface SheetRootProps {
  $dragOffset: number;
  $isDragging: boolean;
  $state: BottomSheetState;
}

export const SheetRoot = styled.section<SheetRootProps>`
  position: absolute;
  top: ${({ $dragOffset, $state }) => getBottomSheetTop($state, $dragOffset)};
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: ${color.ink};
  pointer-events: ${({ $state }) => ($state === 'closed' ? 'none' : 'auto')};
  background: ${color.surface};
  border-radius: ${radius.lg} ${radius.lg} 0 0;
  box-shadow: ${shadow.sheet};
  opacity: ${({ $state }) => ($state === 'closed' ? 0 : 1)};
  touch-action: pan-x;
  user-select: ${({ $isDragging }) => ($isDragging ? 'none' : 'auto')};
  transition:
    ${({ $isDragging }) =>
      $isDragging ? 'none' : 'top 280ms cubic-bezier(0.22, 1, 0.36, 1)'},
    opacity 180ms ease;
  will-change: top;
`;

/**
 * 손잡이와 닫기 버튼이 놓이는 줄. 아래 내용 위에 떠 있다.
 *
 * 사진 위에 얹힐 때도 있어서 배경을 깔지 않는다. 대신 손잡이와 버튼이
 * 각자 자기 배경을 갖는다.
 */
export const SheetTopBar = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: 48px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

export const DragHandleButton = styled.button`
  display: grid;
  width: 76px;
  height: 36px;
  padding: 0;
  cursor: grab;
  touch-action: none;
  background: transparent;
  border: 0;
  place-items: center;

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: -7px;
    border-radius: ${radius.md};
  }
`;

export const Grabber = styled.span<{ $onImage: boolean }>`
  width: 40px;
  height: 4px;
  margin-top: ${space.sm};
  background: ${({ $onImage }) =>
    $onImage ? alpha(color.surface, 85) : color.line};
  border-radius: ${radius.pill};
  box-shadow: ${({ $onImage }) =>
    $onImage ? `0 1px 3px ${alpha(color.ink, 30)}` : 'none'};
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: ${space.md};
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  color: ${color.ink};
  font-size: ${fontSize.xl};
  line-height: 1;
  cursor: pointer;
  background: ${alpha(color.surface, 92)};
  border: 0;
  border-radius: ${radius.circle};
  box-shadow: ${shadow.float};
  place-items: center;

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;

export const ScrollArea = styled.div<{ $canScroll: boolean }>`
  height: 100%;
  overflow-x: hidden;
  overflow-y: ${({ $canScroll }) => ($canScroll ? 'auto' : 'hidden')};
  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

/* -------------------------------------------------------------- 매장 사진 */

/**
 * 시트 맨 위를 꽉 채우는 대표 사진.
 *
 * 높이를 화면 높이에 묶는다. 고정 px 로 두면 작은 기기에서 이름과 주소가
 * 시트 밖으로 밀려나고, 시트 높이의 %로 두면 드래그하는 동안 매 프레임
 * 높이가 바뀌어 레이아웃을 다시 계산한다.
 */
export const Hero = styled.div`
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  height: clamp(140px, 28dvh, 240px);
  overflow: hidden;
  background: ${color.surface2};
`;

export const HeroRail = styled.div<{ $isDragging: boolean }>`
  display: flex;
  height: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-snap-type: ${({ $isDragging }) =>
    $isDragging ? 'none' : 'x mandatory'};
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  user-select: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const HeroFrame = styled.div`
  flex: 0 0 100%;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
`;

export const HeroImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  object-fit: cover;
  -webkit-user-drag: none;
`;

/** 아래쪽만 살짝 어둡게. 사진이 밝아도 장수 표시가 읽힌다. */
export const HeroShade = styled.div`
  position: absolute;
  inset: auto 0 0;
  height: 72px;
  pointer-events: none;
  background: linear-gradient(transparent, ${alpha(color.ink, 34)});
`;

export const HeroCounter = styled.span`
  position: absolute;
  right: ${space.sm};
  bottom: ${space.sm};
  padding: 4px 10px;
  color: ${color.surface};
  font-size: ${fontSize.sm};
  font-variant-numeric: tabular-nums;
  background: ${alpha(color.ink, 55)};
  border-radius: ${radius.pill};
`;

/* ------------------------------------------------------- 1단계 압축 헤더 */

/**
 * 접힌 단계에서는 시트가 116px 만 보인다. 사진을 그리면 윗동강만 나오고
 * 매장 이름이 사라져서, 이름과 한 줄 요약만 남긴다.
 */
export const CompactContent = styled.div`
  padding: 44px ${space.lg} ${space.md};
`;

export const CompactStoreName = styled.h2`
  margin: 0;
  overflow: hidden;
  color: ${color.ink};
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.02em;
`;

export const CompactMeta = styled.p`
  margin: 4px 0 0;
  overflow: hidden;
  color: ${color.ink3};
  font-size: ${fontSize.sm};
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* ------------------------------------------------------------------ 개요 */

export const Content = styled.div<{ $hasHero: boolean }>`
  position: relative;
  padding: ${({ $hasHero }) => ($hasHero ? space.md : '48px')} ${space.lg}
    calc(${space.lg} + env(safe-area-inset-bottom));
  background: ${color.surface};
`;

export const Overview = styled.div`
  padding-bottom: ${space.md};
`;

export const OverviewHeading = styled.div`
  display: flex;
  gap: ${space.sm};
  align-items: baseline;
  justify-content: space-between;
  min-width: 0;
`;

export const StoreName = styled.h2`
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: ${color.ink};
  font-size: ${fontSize.xl};
  font-weight: ${fontWeight.bold};
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.03em;
`;

/** 누를 수 없는 정보라 배경을 주지 않는다. 알약은 누를 수 있다는 신호다. */
export const DistanceBadge = styled.span`
  flex: 0 0 auto;
  color: ${color.ink3};
  font-size: ${fontSize.md};
`;

export const StoreAddress = styled.p`
  margin: 6px 0 0;
  overflow: hidden;
  color: ${color.ink2};
  font-size: ${fontSize.md};
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const UpdatedAt = styled.p<{ $state: BottomSheetState }>`
  display: ${({ $state }) => ($state === 'summary' ? 'none' : 'block')};
  margin: 6px 0 0;
  color: ${color.ink3};
  font-size: ${fontSize.sm};
  line-height: 1.5;
`;

export const SummaryDetails = styled.div`
  display: grid;
  gap: ${space.sm};
  padding-top: ${space.md};
`;

export const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: ${space.sm};
  font-size: ${fontSize.md};
  line-height: 1.55;
`;

export const SummaryLabel = styled.span`
  color: ${color.ink3};
`;

export const SummaryValue = styled.span`
  overflow: hidden;
  color: ${color.ink};
  text-overflow: ellipsis;
  white-space: pre-line;
`;

export const CategoryList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0;
  margin: ${space.sm} 0 0;
  list-style: none;
`;

export const CategoryChip = styled.li`
  padding: 5px 10px;
  color: ${color.accent};
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.bold};
  background: ${color.accentBg};
  border-radius: ${radius.pill};
`;

/* -------------------------------------------------------------- 가챠 사진 */

/**
 * 매장 사진은 맨 위 히어로가 맡는다. 여기는 가챠 사진만 다룬다.
 *
 * 전에는 둘이 탭 하나에 묶여 한 번에 하나만 보였다. 가챠 앱에서 "뭘 뽑을
 * 수 있나"는 탭 뒤에 숨길 정보가 아니다.
 */
export const GachaSection = styled.section`
  /* 구분선 위아래를 같은 간격으로 띄운다. 위쪽은 앞 요소가 무엇이든 여기서 만든다. */
  padding: ${space.lg} 0;
  margin-top: ${space.lg};
  border-top: 1px solid ${color.line};
`;

export const GalleryViewButton = styled.button`
  padding: 6px 10px;
  color: ${color.ink3};
  font-family: inherit;
  font-size: ${fontSize.sm};
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: ${radius.sm};

  &:hover:not(:disabled) {
    color: ${color.accent};
    background: ${color.accentBg};
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 1px;
  }
`;

/**
 * 레일 끝에 남기는 좁은 자리. 사진 칸 하나를 통째로 쓰지 않는다.
 *
 * 마지막 사진 옆에 살짝 보여서 "여기가 끝이고 더 보려면 여기"를 같이 알린다.
 */
export const ShowAllSlot = styled.div`
  display: grid;
  flex: 0 0 84px;
  gap: ${space.xs};
  height: 266px;
  scroll-snap-align: end;
  place-content: center;
  place-items: center;
`;

export const ShowAllButton = styled.button`
  display: grid;
  width: 48px;
  height: 48px;
  padding: 0;
  color: ${color.ink2};
  cursor: pointer;
  background: ${color.surface2};
  border: 1px solid ${color.line};
  border-radius: ${radius.circle};
  place-items: center;

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;

export const ShowAllLabel = styled.span`
  color: ${color.ink3};
  font-size: ${fontSize.sm};
  white-space: nowrap;
`;

export const GalleryViewport = styled.div`
  margin-top: 0;
`;

export const ThumbnailRail = styled.div<{ $isDragging: boolean }>`
  display: flex;
  gap: ${space.xs};
  padding-right: ${space.lg};
  margin-right: -${space.lg};
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-behavior: auto;
  scroll-snap-type: ${({ $isDragging }) =>
    $isDragging ? 'none' : 'x mandatory'};
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  cursor: default;
  user-select: none;
  will-change: scroll-position;

  &,
  & * {
    cursor: default;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

/**
 * 정사각으로 둔다. 가챠 사진은 캡슐이나 피규어 같은 물건 사진이고, 공간을
 * 담는 매장 사진과 모양으로도 구분된다.
 *
 * 한 장이 온전히 들어가고 다음 장이 76px 보이는 크기다.
 */
export const ThumbnailFrame = styled.div`
  flex: 0 0 266px;
  height: 266px;
  overflow: hidden;
  background: ${color.surface2};
  border: 1px solid ${color.line};
  border-radius: ${radius.md};
  scroll-snap-align: start;
  scroll-snap-stop: always;
`;

export const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space.xs};
`;

export const GridImageFrame = styled.div`
  overflow: hidden;
  aspect-ratio: 1;
  background: ${color.surface2};
  border: 1px solid ${color.line};
  border-radius: ${radius.md};
`;

export const ThumbnailImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  object-fit: cover;
  -webkit-user-drag: none;
`;

export const ThumbnailPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: ${color.ink3};
  font-size: ${fontSize.sm};
  pointer-events: none;
  background: ${color.surface2};
`;

/**
 * 지도 마커와 같은 캡슐 모양. 사진이 없을 때 이 자리가 무엇인지 알려준다.
 *
 * 색은 팔레트에서 가져와 조용하게 둔다. 자리 표시가 진짜 사진보다 눈에
 * 띄면 안 된다.
 */
export const ThumbnailPlaceholderMark = styled.svg`
  width: 30%;
  min-width: 44px;
  max-width: 88px;
  aspect-ratio: 1;

  .capsule-body {
    fill: ${color.line};
  }

  .capsule-seam {
    fill: ${color.surface2};
  }
`;

/* ----------------------------------------------- 가챠 사진 전체 (맨 아래) */

/**
 * 전체 보기는 시트 맨 아래에 둔다.
 *
 * 무한 스크롤이 중간에 있으면 그 아래 매장 정보와 가격에 영원히 닿지 못한다.
 * 맨 아래라서 계속 이어 붙여도 안전하다.
 */
export const GachaCatalogSection = styled.section`
  padding: ${space.lg} 0 0;
  margin-top: ${space.lg};
  border-top: 1px solid ${color.line};
  scroll-margin-top: ${space.lg};

  &:focus {
    outline: none;
  }
`;

/** 스크롤이 여기 닿으면 다음 페이지를 부른다. 화면에는 보이지 않는다. */
export const CatalogSentinel = styled.div`
  height: 1px;
`;

export const CatalogStatus = styled.p`
  padding: ${space.md} 0;
  margin: 0;
  color: ${color.ink3};
  font-size: ${fontSize.sm};
  text-align: center;
`;

/** 스크롤이 여기서 벗어나면 '맨 위로'를 띄운다. 스크롤 핸들러를 매 프레임 돌리지 않는다. */
export const TopSentinel = styled.div`
  height: 1px;
`;

/**
 * 시트 오른쪽 아래에 떠 있는 맨 위로.
 *
 * 시트가 position: absolute 라 그 안에서 자리를 잡는다. 스크롤 영역 안에
 * 두면 내용과 같이 밀려 올라간다.
 */
export const ScrollTopButton = styled.button`
  position: absolute;
  right: ${space.md};
  bottom: calc(${space.md} + env(safe-area-inset-bottom));
  z-index: 3;
  display: grid;
  width: 48px;
  height: 48px;
  padding: 0;
  color: ${color.ink2};
  cursor: pointer;
  background: ${alpha(color.surface, 94)};
  border: 1px solid ${color.line};
  border-radius: ${radius.circle};
  box-shadow: ${shadow.float};
  animation: ${fadeUp} 160ms ease;
  place-items: center;

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** 글리프 대신 도형으로 그린다. 폰트마다 삼각형 모양과 크기가 달라진다. */
export const ScrollTopIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: currentcolor;
`;

/* --------------------------------------------------- 가챠 목록 관심 요청 */

export const GachaInterestCard = styled.div`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: ${space.sm} ${space.sm};
  align-items: center;
  padding: ${space.md};
  background: ${color.surface2};
  border: 1px solid ${color.line};
  border-radius: ${radius.md};
`;

export const GachaInterestMark = styled.span`
  display: grid;
  width: 48px;
  height: 48px;
  color: ${color.accent};
  font-size: ${fontSize.xl};
  background: ${color.accentBg};
  border-radius: ${radius.circle};
  place-items: center;
`;

export const GachaInterestCopy = styled.div`
  min-width: 0;
`;

export const GachaInterestTitle = styled.p`
  margin: 0;
  color: ${color.ink};
  font-size: ${fontSize.md};
  font-weight: ${fontWeight.bold};
`;

export const GachaInterestDescription = styled.p`
  margin: 4px 0 0;
  color: ${color.ink2};
  font-size: ${fontSize.sm};
  line-height: 1.55;
`;

export const GachaInterestButton = styled.button`
  grid-column: 1 / -1;
  min-height: 44px;
  color: ${color.surface};
  font-family: inherit;
  font-size: ${fontSize.md};
  font-weight: ${fontWeight.bold};
  cursor: pointer;
  background: ${color.accent};
  border: 0;
  border-radius: ${radius.sm};

  &:disabled {
    color: ${color.ink3};
    cursor: default;
    background: ${color.surface};
    border: 1px solid ${color.line};
  }

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;

/* -------------------------------------------------------------- 매장 정보 */

export const InfoList = styled.dl`
  display: grid;
  gap: ${space.sm};
  padding: ${space.lg} 0;
  margin: 0;
  border-top: 1px solid ${color.line};
`;

export const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: ${space.sm};
  align-items: center;
`;

export const InfoLabel = styled.dt`
  display: flex;
  gap: ${space.xs};
  align-items: center;
  color: ${color.ink3};
  font-size: ${fontSize.md};
  line-height: 1.55;
`;

export const InfoIcon = styled.img`
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
`;

export const InfoValue = styled.dd`
  margin: 0;
  color: ${color.ink};
  font-size: ${fontSize.md};
  line-height: 1.55;
  white-space: pre-wrap;
`;

export const SocialLinkList = styled.ul`
  display: flex;
  gap: ${space.xs};
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
`;

/** 브랜드 색은 팔레트 밖이다. 정해진 색이라야 알아본다. */
export const SocialLink = styled.a<{ $platform: 'instagram' | 'kakao' }>`
  display: grid;
  width: 32px;
  height: 32px;
  color: ${({ $platform }) =>
    $platform === 'kakao' ? brandColor.kakaoInk : color.surface};
  background: ${({ $platform }) =>
    $platform === 'kakao' ? brandColor.kakao : brandColor.instagram};
  border-radius: ${radius.sm};
  place-items: center;

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;

export const InstagramIcon = styled.svg`
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.8;

  .instagram-dot {
    fill: currentcolor;
    stroke: none;
  }
`;

export const KakaoIcon = styled.svg`
  width: 18px;
  height: 18px;
  fill: currentcolor;
`;

/* ---------------------------------------------------------------- 섹션 */

export const Section = styled.section`
  padding: ${space.lg} 0;
  border-top: 1px solid ${color.line};

  &:last-child {
    padding-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 ${space.sm};
  color: ${color.ink};
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
  letter-spacing: -0.02em;
`;

export const IconSectionTitle = styled.h3`
  display: flex;
  gap: ${space.xs};
  align-items: center;
  margin: 0 0 ${space.sm};
  color: ${color.ink};
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
  letter-spacing: -0.02em;
`;

export const SectionIcon = styled.img`
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
`;

export const AmountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space.xs};
`;

export const AmountCard = styled.div`
  display: flex;
  gap: ${space.sm};
  align-items: center;
  min-width: 0;
  padding: ${space.sm};
  background: ${color.surface2};
  border-radius: ${radius.md};
`;

export const AmountIcon = styled.img`
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
`;

export const AmountText = styled.div`
  min-width: 0;
`;

export const AmountLabel = styled.p`
  margin: 0 0 2px;
  color: ${color.ink3};
  font-size: ${fontSize.sm};
`;

export const AmountValue = styled.strong`
  color: ${color.ink};
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
  letter-spacing: -0.02em;
`;

export const PriceList = styled.dl`
  display: grid;
  gap: ${space.sm};
  margin: 0;
`;

export const PriceRow = styled.div`
  display: flex;
  gap: ${space.md};
  align-items: center;
  justify-content: space-between;
`;

export const PriceLabel = styled.dt`
  display: flex;
  gap: ${space.xs};
  align-items: center;
  color: ${color.ink3};
  font-size: ${fontSize.md};
`;

export const PriceIcon = styled.img`
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
`;

export const PriceValue = styled.dd`
  margin: 0;
  color: ${color.ink};
  font-size: ${fontSize.md};
  font-weight: ${fontWeight.bold};
  text-align: right;
`;

export const ChipList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
`;

export const Chip = styled.li`
  padding: 5px 10px;
  color: ${color.ink2};
  font-size: ${fontSize.sm};
  background: ${color.surface2};
  border-radius: ${radius.pill};
`;

/* ------------------------------------------------------ 로딩 · 에러 상태 */

export const LoadingContent = styled.div`
  display: grid;
  gap: ${space.sm};
  padding: 48px ${space.lg} ${space.lg};
`;

export const Skeleton = styled.div<{ width?: string; height?: number }>`
  width: ${({ width }) => width ?? '100%'};
  height: ${({ height }) => `${height ?? 16}px`};
  background: linear-gradient(
      90deg,
      ${color.surface2} 25%,
      ${color.line} 37%,
      ${color.surface2} 63%
    )
    0 0 / 400% 100%;
  border-radius: ${radius.sm};
  animation: ${shimmer} 1.4s ease infinite;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const ErrorBody = styled.div`
  display: grid;
  gap: ${space.sm};
  justify-items: center;
  padding: 56px ${space.lg} ${space.lg};
  text-align: center;
`;

export const ErrorMark = styled.div`
  display: grid;
  width: 48px;
  height: 48px;
  color: ${color.accent};
  font-size: ${fontSize.xl};
  font-weight: ${fontWeight.bold};
  background: ${color.accentBg};
  border-radius: ${radius.circle};
  place-items: center;
`;

export const ErrorTitle = styled.h2`
  margin: 0;
  color: ${color.ink};
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
`;

export const ErrorDescription = styled.p`
  margin: 0;
  color: ${color.ink2};
  font-size: ${fontSize.md};
  line-height: 1.55;
`;

export const RetryButton = styled.button`
  min-height: 44px;
  padding: 0 ${space.lg};
  margin-top: ${space.xs};
  color: ${color.surface};
  font-family: inherit;
  font-size: ${fontSize.md};
  font-weight: ${fontWeight.bold};
  cursor: pointer;
  background: ${color.accent};
  border: 0;
  border-radius: ${radius.sm};

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;

/* ---------------------------------------------------- 스토리북 전용 목업 */

export const DemoMap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(0deg, ${color.line} 0 1px, transparent 1px 42px),
    repeating-linear-gradient(90deg, ${color.line} 0 1px, transparent 1px 42px),
    ${color.surface2};
`;

export const DemoMapLabel = styled.p`
  position: absolute;
  top: ${space.md};
  left: 50%;
  padding: ${space.xs} ${space.md};
  margin: 0;
  color: ${color.ink2};
  font-size: ${fontSize.sm};
  white-space: nowrap;
  background: ${color.surface};
  border-radius: ${radius.pill};
  box-shadow: ${shadow.float};
  transform: translateX(-50%);
`;

export const DemoPinButton = styled.button`
  position: absolute;
  width: 25px;
  height: 25px;
  padding: 0;
  cursor: pointer;
  background: ${color.accent};
  border: 0;
  border-radius: ${radius.circle};
  box-shadow: ${shadow.float};

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;
