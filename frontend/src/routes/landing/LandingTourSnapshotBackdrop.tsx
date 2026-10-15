import styled from '@emotion/styled';

import desktopChat from './assets/desktop-chat.png';
import desktopMap from './assets/desktop-map.png';
import desktopSearch from './assets/desktop-search.png';
import desktopTrade from './assets/desktop-trade.png';
import mobileChat from './assets/mobile-chat.png';
import mobileMap from './assets/mobile-map.png';
import mobileSearch from './assets/mobile-search.png';
import mobileTrade from './assets/mobile-trade.png';
import type { LandingTourStepIndex } from './LandingTour';
import {
  DESKTOP_SNAPSHOT_SIZE,
  DESKTOP_TARGET_RECTS,
  LANDING_TOUR_TARGETS,
  MOBILE_SNAPSHOT_SIZE,
  MOBILE_TARGET_RECTS,
  type SnapshotSize,
  type SnapshotTargetRect,
} from './landingTourGeometry';

const DESKTOP_SNAPSHOTS = [
  desktopTrade,
  desktopMap,
  desktopSearch,
  desktopChat,
] as const;

const MOBILE_SNAPSHOTS = [
  mobileTrade,
  mobileMap,
  mobileSearch,
  mobileChat,
] as const;

interface LandingTourSnapshotBackdropProps {
  stepIndex: LandingTourStepIndex;
}

export default function LandingTourSnapshotBackdrop({
  stepIndex,
}: LandingTourSnapshotBackdropProps) {
  const target = LANDING_TOUR_TARGETS[stepIndex];

  return (
    <SnapshotViewport aria-hidden="true">
      <SnapshotCanvas $alignBottom={stepIndex === 0}>
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={MOBILE_SNAPSHOTS[stepIndex]}
          />
          <SnapshotImage
            src={DESKTOP_SNAPSHOTS[stepIndex]}
            alt=""
            draggable={false}
          />
        </picture>

        <SnapshotTargetMarker
          data-landing-tour-snapshot-target={target}
          data-snapshot-layout="desktop"
          $rect={DESKTOP_TARGET_RECTS[target]}
          $snapshotSize={DESKTOP_SNAPSHOT_SIZE}
        />
        <SnapshotTargetMarker
          data-landing-tour-snapshot-target={target}
          data-snapshot-layout="mobile"
          $isMobile
          $rect={MOBILE_TARGET_RECTS[target]}
          $snapshotSize={MOBILE_SNAPSHOT_SIZE}
        />
      </SnapshotCanvas>
    </SnapshotViewport>
  );
}

const SnapshotViewport = styled.div`
  position: fixed;
  overflow: hidden;
  background: #ffffff;
  inset: 0;
`;

const SnapshotCanvas = styled.div<{ $alignBottom: boolean }>`
  position: absolute;
  top: ${({ $alignBottom }) => ($alignBottom ? 'auto' : '0')};
  bottom: ${({ $alignBottom }) => ($alignBottom ? '0' : 'auto')};
  left: 50%;
  width: max(100vw, 160vh);
  height: max(100vh, 62.5vw);
  transform: translateX(-50%);

  picture {
    display: block;
    width: 100%;
    height: 100%;
  }

  @media (max-width: 767px) {
    width: max(100vw, 54.1667vh);
    height: max(100vh, 184.6154vw);
  }
`;

const SnapshotImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
`;

const SnapshotTargetMarker = styled.span<{
  $isMobile?: boolean;
  $rect: SnapshotTargetRect;
  $snapshotSize: SnapshotSize;
}>`
  position: absolute;
  top: ${({ $rect, $snapshotSize }) =>
    `${($rect.y / $snapshotSize.height) * 100}%`};
  left: ${({ $rect, $snapshotSize }) =>
    `${($rect.x / $snapshotSize.width) * 100}%`};
  display: ${({ $isMobile }) => ($isMobile ? 'none' : 'block')};
  width: ${({ $rect, $snapshotSize }) =>
    `${($rect.width / $snapshotSize.width) * 100}%`};
  height: ${({ $rect, $snapshotSize }) =>
    `${($rect.height / $snapshotSize.height) * 100}%`};
  pointer-events: none;

  @media (max-width: 767px) {
    display: ${({ $isMobile }) => ($isMobile ? 'block' : 'none')};
  }
`;
