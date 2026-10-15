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
  const objectPosition = stepIndex === 0 ? 'center bottom' : 'center top';

  return (
    <SnapshotPicture aria-hidden="true">
      <source media="(max-width: 767px)" srcSet={MOBILE_SNAPSHOTS[stepIndex]} />
      <SnapshotImage
        src={DESKTOP_SNAPSHOTS[stepIndex]}
        alt=""
        draggable={false}
        $objectPosition={objectPosition}
      />
    </SnapshotPicture>
  );
}

const SnapshotPicture = styled.picture`
  position: fixed;
  overflow: hidden;
  background: #ffffff;
  inset: 0;
`;

const SnapshotImage = styled.img<{ $objectPosition: string }>`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: ${({ $objectPosition }) => $objectPosition};
  user-select: none;
`;
