import styled from '@emotion/styled';
import { Link } from 'react-router';

import {
  isLaunchEventBannerVisible,
  LAUNCH_EVENT_CONFIG,
} from './launchEventConfig';
import {
  getLaunchEventDday,
  LAUNCH_EVENT_CONTENT,
  LAUNCH_EVENT_PATH,
} from './launchEventContent';
import { useLaunchEventClock } from './useLaunchEventClock';

export function LaunchEventBanner() {
  const now = useLaunchEventClock();
  if (!isLaunchEventBannerVisible(LAUNCH_EVENT_CONFIG, now)) return null;

  return (
    <Wrapper>
      <Banner
        to={LAUNCH_EVENT_PATH}
        aria-label="가치가챠 앱 출시 기념 가챠 선물 이벤트 자세히 보기"
      >
        <Copy>
          <small>
            EVENT · {getLaunchEventDday(LAUNCH_EVENT_CONFIG.endAt, now)}
          </small>
          <strong>{LAUNCH_EVENT_CONTENT.shortTitle}</strong>
          <span>앱 출시 기념 · 총 8명에게 랜덤 선물</span>
        </Copy>
        <Artwork aria-hidden="true">
          {LAUNCH_EVENT_CONTENT.prizeImage ? (
            <img src={LAUNCH_EVENT_CONTENT.prizeImage} alt="" />
          ) : (
            <Gift>🎁</Gift>
          )}
        </Artwork>
      </Banner>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 1264px;
  margin: 0 auto;
  padding: 24px 32px 0;
  box-sizing: border-box;
  @media (max-width: 768px) {
    padding: 8px 16px 12px;
  }
`;
const Banner = styled(Link)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(160px, 30%, 240px);
  align-items: stretch;
  min-height: 156px;
  overflow: hidden;
  background: #b8324b;
  border-radius: 16px;
  color: #fff;
  text-decoration: none;
  &:focus-visible {
    outline: 3px solid #242122;
    outline-offset: 4px;
  }
  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr) 34%;
    min-height: 112px;
  }
`;
const Copy = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 20px 24px;
  word-break: keep-all;
  overflow-wrap: anywhere;
  small {
    font-size: 12px;
    line-height: 1.4;
  }
  strong {
    font-size: 24px;
    line-height: 1.4;
  }
  span {
    font-size: 14px;
    line-height: 1.5;
  }
  @media (max-width: 768px) {
    padding: 16px;
    gap: 6px;
    strong {
      font-size: 17px;
    }
    span {
      font-size: 11px;
    }
  }
`;
const Artwork = styled.div`
  position: relative;
  min-width: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* 원본 사진은 보존하고 접점만 배너 색으로 부드럽게 연결한다. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      #b8324b 0%,
      rgb(184 50 75 / 72%) 10%,
      rgb(184 50 75 / 28%) 24%,
      rgb(184 50 75 / 0%) 45%
    );
  }
`;
const Gift = styled.span`
  font-size: 56px;
  padding: 20px;
`;
