import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

import { getBottomSheetTop } from '../model/bottomSheetState';
import type { BottomSheetState } from '../model/storeDetail';

const CONTENT_CARD_PADDING = '12px 16px';

const shimmer = keyframes`
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
`;

export const StoryFrame = styled.div`
  position: relative;
  width: min(100vw, 430px);
  height: 100dvh;
  min-height: 720px;
  margin: 0 auto;
  overflow: hidden;
  background: #f5f5f8;
  font-family:
    Pretendard,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
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
  color: #2f292c;
  pointer-events: ${({ $state }) => ($state === 'closed' ? 'none' : 'auto')};
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 36px rgb(73 53 60 / 14%);
  opacity: ${({ $state }) => ($state === 'closed' ? 0 : 1)};
  touch-action: pan-x;
  user-select: ${({ $isDragging }) => ($isDragging ? 'none' : 'auto')};
  transition:
    ${({ $isDragging }) => ($isDragging ? 'none' : 'top 280ms cubic-bezier(0.22, 1, 0.36, 1)')},
    opacity 180ms ease;
  will-change: top;
  font-family:
    Pretendard,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
`;

export const SheetTopBar = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  background: linear-gradient(180deg, #ffffff 72%, rgb(255 255 255 / 0%));
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
    outline: 3px solid rgb(180 73 113 / 24%);
    outline-offset: -7px;
    border-radius: 14px;
  }
`;

export const Grabber = styled.span`
  width: 44px;
  height: 5px;
  background: #cfc4c8;
  border-radius: 999px;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 16px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #3a3034;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;
  background: rgb(255 255 255 / 92%);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgb(73 53 60 / 14%);
  place-items: center;

  &:focus-visible {
    outline: 3px solid rgb(180 73 113 / 24%);
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

export const Hero = styled.div`
  position: relative;
  width: 100%;
  height: 224px;
  overflow: hidden;
  background: #f1eff8;
`;

export const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const HeroShade = styled.div`
  position: absolute;
  inset: auto 0 0;
  height: 60px;
  pointer-events: none;
  background: linear-gradient(transparent, rgb(24 20 31 / 22%));
`;

export const DefaultImage = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: #746f7d;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.01em;
  background:
    radial-gradient(
      circle at 12% 18%,
      rgb(255 255 255 / 68%) 0 8%,
      transparent 9%
    ),
    radial-gradient(
      circle at 88% 82%,
      rgb(255 255 255 / 48%) 0 15%,
      transparent 16%
    ),
    linear-gradient(140deg, #f6eafa, #e8e4fa 52%, #e0ecff);
`;

export const DefaultImageMark = styled.div`
  position: relative;
  width: 80px;
  height: 64px;
  border: 5px solid rgb(255 255 255 / 88%);
  border-radius: 19px;
  box-shadow: 0 12px 24px rgb(74 55 112 / 12%);
  transform: rotate(-2deg);

  &::before {
    position: absolute;
    top: 11px;
    right: 12px;
    width: 13px;
    height: 13px;
    content: '';
    background: #f8bddd;
    border-radius: 50%;
  }

  &::after {
    position: absolute;
    right: 8px;
    bottom: 8px;
    left: 8px;
    height: 27px;
    content: '';
    background: linear-gradient(145deg, #a692ef 49%, #8170d0 50%);
    clip-path: polygon(0 100%, 34% 32%, 53% 62%, 70% 20%, 100% 100%);
    border-radius: 4px;
  }
`;

export const Content = styled.div<{ $state: BottomSheetState }>`
  position: relative;
  padding: ${({ $state }) => ($state === 'summary' ? '44px' : '48px')} 20px
    calc(36px + env(safe-area-inset-bottom));
  background: #ffffff;
`;

export const Overview = styled.div<{ $state: BottomSheetState }>`
  padding: ${({ $state }) => ($state === 'summary' ? '0 0 10px' : '4px 0 18px')};
  border-bottom: 1px solid #f0e8eb;
`;

export const OverviewHeading = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
`;

export const StoreAddress = styled.p`
  margin: 5px 0 0;
  overflow: hidden;
  color: #7f7478;
  font-size: 13px;
  font-weight: 520;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Headline = styled.div`
  padding-bottom: 22px;
  border-bottom: 1px solid #f0e8eb;
`;

export const DistanceBadge = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: 26px;
  padding: 4px 10px;
  color: #963c5d;
  font-size: 12px;
  font-weight: 750;
  background: #fde8ef;
  border-radius: 999px;
`;

export const StoreName = styled.h2`
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #2d2729;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.035em;
`;

export const UpdatedAt = styled.p<{ $state: BottomSheetState }>`
  display: ${({ $state }) => ($state === 'summary' ? 'none' : 'block')};
  margin: 6px 0 0;
  color: #9b9094;
  font-size: 11px;
  line-height: 1.5;
`;

export const PhotoSection = styled.section<{ $state: BottomSheetState }>`
  padding: ${({ $state }) => ($state === 'summary' ? '14px 0' : '24px 0')};
  border-bottom: 1px solid #f0e8eb;
`;

export const PhotoTitleRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

export const GalleryTabs = styled.div`
  display: flex;
  min-width: 0;
  padding: 3px;
  background: #f8f1f4;
  border-radius: 12px;
`;

export const GalleryTab = styled.button<{ $isActive: boolean }>`
  min-height: 34px;
  padding: 7px 11px;
  color: ${({ $isActive }) => ($isActive ? '#7f3150' : '#87777d')};
  font-size: 13px;
  font-weight: 750;
  white-space: nowrap;
  cursor: pointer;
  background: ${({ $isActive }) => ($isActive ? '#ffffff' : 'transparent')};
  border: 0;
  border-radius: 9px;
  box-shadow: ${({ $isActive }) =>
    $isActive ? '0 2px 8px rgb(98 56 71 / 10%)' : 'none'};

  &:focus-visible {
    outline: 3px solid rgb(180 73 113 / 24%);
    outline-offset: 1px;
  }
`;

export const GalleryControls = styled.div`
  display: flex;
  gap: 7px;
  align-items: center;
`;

export const GalleryViewButton = styled.button`
  min-height: 32px;
  padding: 6px 9px;
  color: #8a4861;
  font-size: 12px;
  font-weight: 750;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 9px;

  &:hover:not(:disabled) {
    background: #fff0f5;
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: 3px solid rgb(180 73 113 / 24%);
    outline-offset: 1px;
  }
`;

export const GalleryControl = styled.button`
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0 0 2px;
  color: #795a67;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;
  background: #fff0f5;
  border: 1px solid #f2d9e2;
  border-radius: 50%;
  transition:
    color 140ms ease,
    background 140ms ease,
    opacity 140ms ease;
  place-items: center;

  &:hover:not(:disabled) {
    color: #ffffff;
    background: #ad456d;
  }

  &:disabled {
    cursor: default;
    opacity: 0.34;
  }

  &:focus-visible {
    outline: 3px solid rgb(180 73 113 / 24%);
    outline-offset: 2px;
  }
`;

export const GalleryViewport = styled.div<{ $state: BottomSheetState }>`
  height: ${({ $state }) => ($state === 'summary' ? '142px' : 'auto')};
  margin-top: ${({ $state }) => ($state === 'summary' ? '10px' : '15px')};
  overflow: ${({ $state }) => ($state === 'summary' ? 'hidden' : 'visible')};
`;

export const ThumbnailRail = styled.div<{ $isDragging: boolean }>`
  display: flex;
  gap: 10px;
  padding-right: 20px;
  margin-right: -20px;
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

export const ThumbnailFrame = styled.div`
  flex: 0 0 76%;
  height: 154px;
  overflow: hidden;
  background: #faf3f5;
  border: 1px solid #f0e3e7;
  border-radius: 17px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
`;

export const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-top: 15px;
`;

export const GridImageFrame = styled.div`
  overflow: hidden;
  aspect-ratio: 1;
  background: #faf3f5;
  border: 1px solid #f0e3e7;
  border-radius: 14px;
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
  color: #85787d;
  font-size: 11px;
  font-weight: 650;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 15% 16%,
      rgb(255 255 255 / 72%) 0 8%,
      transparent 9%
    ),
    radial-gradient(
      circle at 86% 82%,
      rgb(255 255 255 / 52%) 0 16%,
      transparent 17%
    ),
    linear-gradient(140deg, #fff4f7, #f9e8ee 52%, #f5eee8);
`;

export const ThumbnailPlaceholderMark = styled.div`
  position: relative;
  width: 48px;
  height: 38px;
  border: 3px solid rgb(255 255 255 / 90%);
  border-radius: 11px;
  box-shadow: 0 8px 18px rgb(108 70 82 / 10%);

  &::before {
    position: absolute;
    top: 7px;
    right: 8px;
    width: 8px;
    height: 8px;
    content: '';
    background: #f8bddd;
    border-radius: 50%;
  }

  &::after {
    position: absolute;
    right: 5px;
    bottom: 5px;
    left: 5px;
    height: 17px;
    content: '';
    background: linear-gradient(145deg, #d7a0b3 49%, #bd7d94 50%);
    clip-path: polygon(0 100%, 34% 32%, 53% 62%, 70% 20%, 100% 100%);
    border-radius: 3px;
  }
`;

export const InfoList = styled.dl`
  display: grid;
  gap: 10px;
  padding: 22px 0;
  margin: 0;
  border-bottom: 1px solid #f0e8eb;
`;

export const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 58px;
  padding: ${CONTENT_CARD_PADDING};
  background: #fffdfd;
  border: 1px solid #f0e7e7;
  border-radius: 14px;
  box-shadow: 0 3px 10px rgb(96 70 77 / 6%);
`;

export const InfoLabel = styled.dt`
  display: flex;
  gap: 9px;
  align-items: center;
  color: #73676c;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.65;
`;

export const InfoIcon = styled.img`
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
`;

export const InfoValue = styled.dd`
  margin: 0;
  color: #3a3135;
  font-size: 14px;
  font-weight: 520;
  line-height: 1.65;
  white-space: pre-wrap;
`;

export const SocialLinkList = styled.ul`
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  margin: 0;
  list-style: none;
`;

export const SocialLink = styled.a<{ $platform: 'instagram' | 'kakao' }>`
  display: grid;
  width: 40px;
  height: 40px;
  color: ${({ $platform }) => ($platform === 'kakao' ? '#251c1c' : '#ffffff')};
  text-decoration: none;
  background: ${({ $platform }) =>
    $platform === 'kakao'
      ? '#fee500'
      : 'linear-gradient(145deg, #6c45d7, #d83c72 54%, #f1a13f)'};
  border: 3px solid #ffffff;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgb(155 48 90 / 22%);
  transition:
    box-shadow 140ms ease,
    transform 140ms ease;
  place-items: center;

  &:hover {
    box-shadow: 0 5px 14px rgb(155 48 90 / 30%);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 3px solid rgb(180 73 113 / 25%);
    outline-offset: 2px;
  }
`;

export const InstagramIcon = styled.svg`
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.8;

  .instagram-dot {
    fill: currentcolor;
    stroke: none;
  }
`;

export const KakaoIcon = styled.svg`
  width: 27px;
  height: 27px;
  fill: currentcolor;
`;

export const Section = styled.section`
  padding: 24px 0;
  border-bottom: 1px solid #f0e8eb;

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 15px;
  color: #342b2f;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.025em;
`;

export const IconSectionTitle = styled.h3`
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 0 15px;
  color: #342b2f;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.025em;
`;

export const SectionIcon = styled.img`
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
`;

export const AmountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

export const AmountCard = styled.div`
  display: flex;
  gap: 11px;
  align-items: center;
  min-width: 0;
  padding: ${CONTENT_CARD_PADDING};
  background: #fff9fb;
  border: 1px solid #f1e2e7;
  border-radius: 15px;
`;

export const AmountIcon = styled.img`
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
`;

export const AmountText = styled.div`
  min-width: 0;
`;

export const AmountLabel = styled.p`
  margin: 0 0 3px;
  color: #7c6f74;
  font-size: 12px;
  font-weight: 650;
`;

export const AmountValue = styled.strong`
  color: #3d3035;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

export const PriceList = styled.dl`
  margin: 0;
  overflow: hidden;
  background: #fffdfd;
  border: 1px solid #f0e3e7;
  border-radius: 15px;
`;

export const PriceRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 62px;
  padding: ${CONTENT_CARD_PADDING};
  border-bottom: 1px solid #f3e9ec;

  &:last-child {
    border-bottom: 0;
  }
`;

export const PriceLabel = styled.dt`
  display: flex;
  gap: 10px;
  align-items: center;
  color: #6f6267;
  font-size: 13px;
  font-weight: 700;
`;

export const PriceIcon = styled.img`
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
`;

export const PriceValue = styled.dd`
  margin: 0;
  color: #3a3034;
  font-size: 14px;
  font-weight: 750;
  text-align: right;
`;

export const ChipList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
`;

export const Chip = styled.li`
  padding: 8px 12px;
  color: #6d5660;
  font-size: 12px;
  font-weight: 700;
  background: #fff0f5;
  border: 1px solid #f1dce4;
  border-radius: 999px;
`;

export const CompactScrollArea = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const CompactContent = styled.div`
  padding: 47px 20px calc(24px + env(safe-area-inset-bottom));
`;

export const CompactHeadline = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
`;

export const CompactTitleGroup = styled.div`
  min-width: 0;
`;

export const CompactStoreName = styled.h2`
  margin: 0;
  overflow: hidden;
  color: #32292d;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.03em;
`;

export const CompactMeta = styled.p`
  margin: 4px 0 0;
  overflow: hidden;
  color: #8d8186;
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CompactDistance = styled.span`
  flex: 0 0 auto;
  padding: 5px 9px;
  color: #963c5d;
  font-size: 11px;
  font-weight: 750;
  background: #fde8ef;
  border-radius: 999px;
`;

export const SummaryDetails = styled.div<{ $state: BottomSheetState }>`
  display: grid;
  gap: 14px;
  padding-top: ${({ $state }) => ($state === 'summary' ? '10px' : '18px')};
`;

export const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 10px;
  font-size: 13px;
  line-height: 1.55;
`;

export const SummaryLabel = styled.span`
  color: #8f8287;
  font-weight: 650;
`;

export const SummaryValue = styled.span`
  overflow: hidden;
  color: #463a3f;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: pre-line;
`;

export const CategoryList = styled.ul<{ $state: BottomSheetState }>`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: ${({ $state }) => ($state === 'summary' ? '10px 0 0' : '17px 0 0')};
  list-style: none;
`;

export const CategoryChip = styled.li`
  padding: 7px 12px;
  color: #7b4d5f;
  font-size: 12px;
  font-weight: 750;
  background: #fde7ef;
  border: 1px solid #f2d5e0;
  border-radius: 999px;

  &:nth-of-type(4n + 2) {
    color: #88492f;
    background: #fbe9df;
    border-color: #f2d7c9;
  }

  &:nth-of-type(4n + 3) {
    color: #715d35;
    background: #f5eddc;
    border-color: #eadfca;
  }

  &:nth-of-type(4n + 4) {
    color: #65566c;
    background: #eee8f0;
    border-color: #e1d7e5;
  }
`;

export const SwipeHint = styled.p`
  margin: 16px 0 0;
  color: #aaa4af;
  font-size: 11px;
  text-align: center;
`;

export const DemoMap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(
      30deg,
      transparent 48%,
      rgb(255 255 255 / 65%) 49% 52%,
      transparent 53%
    ),
    linear-gradient(
      120deg,
      transparent 47%,
      rgb(255 255 255 / 58%) 48% 52%,
      transparent 53%
    ),
    #e5e9e1;
  background-size:
    130px 130px,
    180px 180px,
    auto;
`;

export const DemoMapLabel = styled.p`
  position: absolute;
  top: 24px;
  left: 20px;
  padding: 8px 12px;
  margin: 0;
  color: #625d68;
  font-size: 12px;
  font-weight: 700;
  background: rgb(255 255 255 / 88%);
  border-radius: 999px;
  box-shadow: 0 4px 14px rgb(55 50 63 / 10%);
`;

export const DemoPinButton = styled.button`
  position: absolute;
  top: 38%;
  left: 52%;
  width: 42px;
  height: 42px;
  padding: 0;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  background: #a8461c;
  border: 4px solid #ffffff;
  border-radius: 50% 50% 50% 8px;
  box-shadow: 0 8px 18px rgb(111 49 22 / 28%);
  transform: translate(-50%, -50%) rotate(-45deg);

  span {
    display: block;
    transform: rotate(45deg);
  }

  &:focus-visible {
    outline: 4px solid rgb(168 70 28 / 25%);
    outline-offset: 4px;
  }
`;

export const LoadingHero = styled.div`
  width: 100%;
  height: 224px;
  background: linear-gradient(90deg, #eeecf1 25%, #f7f6f8 50%, #eeecf1 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite linear;
`;

export const LoadingContent = styled.div`
  display: grid;
  gap: 14px;
  padding: 60px 20px 28px;
`;

export const Skeleton = styled.div<{ width?: string; height?: number }>`
  width: ${({ width }) => width ?? '100%'};
  height: ${({ height }) => height ?? 18}px;
  background: linear-gradient(90deg, #eeecf1 25%, #f8f7f9 50%, #eeecf1 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: ${shimmer} 1.4s infinite linear;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const ErrorBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 28px;
  text-align: center;
`;

export const ErrorMark = styled.div`
  display: grid;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  color: #a8461c;
  font-size: 30px;
  font-weight: 800;
  background: #fbe9df;
  border-radius: 22px;
  place-items: center;
`;

export const ErrorTitle = styled.h2`
  margin: 0;
  color: #28242e;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.025em;
`;

export const ErrorDescription = styled.p`
  margin: 9px 0 22px;
  color: #817b87;
  font-size: 14px;
  line-height: 1.6;
`;

export const RetryButton = styled.button`
  min-width: 112px;
  height: 44px;
  padding: 0 20px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  background: #a8461c;
  border: 0;
  border-radius: 13px;

  &:hover {
    background: #903814;
  }

  &:focus-visible {
    outline: 3px solid rgb(168 70 28 / 25%);
    outline-offset: 3px;
  }
`;
