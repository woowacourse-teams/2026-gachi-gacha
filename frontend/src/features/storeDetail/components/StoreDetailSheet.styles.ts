import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

import type { BottomSheetState } from '../model/storeDetail';

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
  background: #ececf2;
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

function getSheetTop(state: BottomSheetState, dragOffset: number) {
  const positions: Record<BottomSheetState, string> = {
    closed: `calc(100% + ${dragOffset}px)`,
    collapsed: `calc(100% - 116px + ${dragOffset}px)`,
    summary: `calc(55% + ${dragOffset}px)`,
    full: `calc(12px + ${dragOffset}px)`,
  };

  return positions[state];
}

export const SheetRoot = styled.section<SheetRootProps>`
  position: absolute;
  top: ${({ $dragOffset, $state }) => getSheetTop($state, $dragOffset)};
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #24222a;
  pointer-events: ${({ $state }) => ($state === 'closed' ? 'none' : 'auto')};
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 36px rgb(35 29 48 / 16%);
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
    outline: 3px solid rgb(116 83 255 / 28%);
    outline-offset: -7px;
    border-radius: 14px;
  }
`;

export const Grabber = styled.span`
  width: 44px;
  height: 5px;
  background: #c5c0ca;
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
  color: #35313d;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;
  background: rgb(255 255 255 / 92%);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgb(38 30 53 / 15%);
  place-items: center;

  &:focus-visible {
    outline: 3px solid rgb(116 83 255 / 30%);
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

export const Content = styled.div`
  position: relative;
  padding: 48px 20px calc(36px + env(safe-area-inset-bottom));
  background: #ffffff;
`;

export const Overview = styled.div`
  padding: 4px 0 18px;
  border-bottom: 1px solid #efedf2;
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
  color: #77717c;
  font-size: 13px;
  font-weight: 520;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Headline = styled.div`
  padding-bottom: 22px;
  border-bottom: 1px solid #efedf2;
`;

export const DistanceBadge = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: 26px;
  padding: 4px 10px;
  color: #6248c8;
  font-size: 12px;
  font-weight: 750;
  background: #f1edff;
  border-radius: 999px;
`;

export const StoreName = styled.h2`
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #211f27;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.035em;
`;

export const UpdatedAt = styled.p`
  margin: 6px 0 0;
  color: #99949f;
  font-size: 11px;
  line-height: 1.5;
`;

export const PhotoSection = styled.section`
  padding: 24px 0;
  border-bottom: 1px solid #efedf2;
`;

export const ThumbnailRail = styled.div`
  display: flex;
  gap: 10px;
  padding-right: 20px;
  margin-right: -20px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-snap-type: x proximity;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const ThumbnailFrame = styled.div`
  flex: 0 0 76%;
  height: 154px;
  overflow: hidden;
  background: #f1eff8;
  border: 1px solid #ece8f2;
  border-radius: 17px;
  scroll-snap-align: start;

  &:nth-of-type(n + 2) {
    flex-basis: 44%;
  }
`;

export const ThumbnailImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const ThumbnailPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #817b8a;
  font-size: 11px;
  font-weight: 650;
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
    linear-gradient(140deg, #f7ebfa, #e9e5fa 52%, #e2edff);
`;

export const ThumbnailPlaceholderMark = styled.div`
  position: relative;
  width: 48px;
  height: 38px;
  border: 3px solid rgb(255 255 255 / 90%);
  border-radius: 11px;
  box-shadow: 0 8px 18px rgb(74 55 112 / 10%);

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
    background: linear-gradient(145deg, #a692ef 49%, #8170d0 50%);
    clip-path: polygon(0 100%, 34% 32%, 53% 62%, 70% 20%, 100% 100%);
    border-radius: 3px;
  }
`;

export const InfoList = styled.dl`
  display: grid;
  gap: 16px;
  padding: 22px 0;
  margin: 0;
  border-bottom: 1px solid #efedf2;
`;

export const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
`;

export const InfoLabel = styled.dt`
  color: #8c8792;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.65;
`;

export const InfoValue = styled.dd`
  margin: 0;
  color: #35313b;
  font-size: 14px;
  font-weight: 520;
  line-height: 1.65;
  white-space: pre-wrap;
`;

export const InstagramLink = styled.a`
  color: #6248c8;
  font-weight: 650;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 3px solid rgb(116 83 255 / 25%);
    outline-offset: 3px;
    border-radius: 3px;
  }
`;

export const Section = styled.section`
  padding: 24px 0;
  border-bottom: 1px solid #efedf2;

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 15px;
  color: #2b2831;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.025em;
`;

export const AmountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

export const AmountCard = styled.div`
  padding: 16px;
  background: #f8f7fa;
  border: 1px solid #f0eef3;
  border-radius: 15px;
`;

export const AmountLabel = styled.p`
  margin: 0 0 6px;
  color: #817c87;
  font-size: 12px;
  font-weight: 650;
`;

export const AmountValue = styled.strong`
  color: #393440;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

export const AvailabilityList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

export const Availability = styled.div<{ available: boolean }>`
  display: flex;
  gap: 7px;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  color: ${({ available }) => (available ? '#4f389f' : '#918c97')};
  font-size: 12px;
  font-weight: 700;
  background: ${({ available }) => (available ? '#f2eeff' : '#f6f5f7')};
  border-radius: 12px;

  &::before {
    display: grid;
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    color: ${({ available }) => (available ? '#ffffff' : '#8e8993')};
    content: '${({ available }) => (available ? '✓' : '–')}';
    background: ${({ available }) => (available ? '#7960d8' : '#dedbe1')};
    border-radius: 50%;
    place-items: center;
  }
`;

export const PriceList = styled.dl`
  margin: 0;
  overflow: hidden;
  border: 1px solid #ece9f0;
  border-radius: 15px;
`;

export const PriceRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 10px 15px;
  border-bottom: 1px solid #f0eef3;

  &:last-child {
    border-bottom: 0;
  }
`;

export const PriceLabel = styled.dt`
  color: #6e6974;
  font-size: 13px;
  font-weight: 650;
`;

export const PriceValue = styled.dd`
  margin: 0;
  color: #302c36;
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
  color: #5f5767;
  font-size: 12px;
  font-weight: 650;
  background: #f6f3fa;
  border: 1px solid #ebe5f1;
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
  color: #28242e;
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
  color: #8d8792;
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CompactDistance = styled.span`
  flex: 0 0 auto;
  padding: 5px 9px;
  color: #6248c8;
  font-size: 11px;
  font-weight: 750;
  background: #f1edff;
  border-radius: 999px;
`;

export const SummaryDetails = styled.div`
  display: grid;
  gap: 14px;
  padding-top: 18px;
`;

export const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 10px;
  font-size: 13px;
  line-height: 1.55;
`;

export const SummaryLabel = styled.span`
  color: #918b96;
  font-weight: 650;
`;

export const SummaryValue = styled.span`
  overflow: hidden;
  color: #433e48;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: pre-line;
`;

export const SummaryAmounts = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
`;

export const SummaryAmount = styled.div`
  min-height: 62px;
  padding: 11px 14px;
  color: #77717c;
  font-size: 12px;
  background: #f8f7fa;
  border-radius: 13px;

  strong {
    display: block;
    margin-top: 4px;
    color: #393440;
    font-size: 15px;
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
  background: #7457d8;
  border: 4px solid #ffffff;
  border-radius: 50% 50% 50% 8px;
  box-shadow: 0 8px 18px rgb(57 42 105 / 28%);
  transform: translate(-50%, -50%) rotate(-45deg);

  span {
    display: block;
    transform: rotate(45deg);
  }

  &:focus-visible {
    outline: 4px solid rgb(116 87 216 / 28%);
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
  color: #7960d8;
  font-size: 30px;
  font-weight: 800;
  background: #f0ebff;
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
  background: #6e52d3;
  border: 0;
  border-radius: 13px;

  &:hover {
    background: #6046c2;
  }

  &:focus-visible {
    outline: 3px solid rgb(110 82 211 / 28%);
    outline-offset: 3px;
  }
`;
