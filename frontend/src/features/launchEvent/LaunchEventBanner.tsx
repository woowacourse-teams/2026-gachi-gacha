import styled from '@emotion/styled';
import { Link } from 'react-router';

import {
  getLaunchEventAvailability,
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
  if (getLaunchEventAvailability(LAUNCH_EVENT_CONFIG, now) !== 'open')
    return null;

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
        {LAUNCH_EVENT_CONTENT.prizeImage ? (
          <img src={LAUNCH_EVENT_CONTENT.prizeImage} alt="" />
        ) : (
          <Gift aria-hidden="true">🎁</Gift>
        )}
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  img {
    width: 200px;
    height: 156px;
    object-fit: contain;
    background: #fff5ee;
  }
  @media (max-width: 768px) {
    min-height: 112px;
    img {
      width: 112px;
      height: 112px;
    }
  }
`;
const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 24px;
  small {
    font-size: 12px;
  }
  strong {
    font-size: 24px;
  }
  span {
    font-size: 14px;
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
const Gift = styled.span`
  font-size: 56px;
  padding: 20px;
`;
