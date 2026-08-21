import styled from '@emotion/styled';

import {
  alpha,
  color,
  focusRing,
  fontSize,
  radius,
  space,
} from '@/styles/tokens';

/**
 * 뒤를 가리는 막.
 *
 * 흐림(`backdrop-filter`)은 쓰지 않는다. 흐림을 세게 주면 지도의 도로와 블록이
 * 뭉개져 결국 균일한 어두운 면이 되고, 약하게 주면 저사양 기기에서 값을 치르고도
 * 얻는 게 적다. 단색으로도 뒤 형태는 남는다.
 */
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: ${alpha(color.ink, 90)};
`;

/** 앱과 같은 폭 안에 둔다. 뷰어만 넓어지면 화면이 갑자기 커진 것처럼 보인다. */
export const Frame = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 430px;
  height: 100%;
  margin: 0 auto;
`;

/**
 * 상단바에 배경을 깔지 않는다. 전체에 그라데이션을 깔면 사진 위쪽이 어두워진다.
 * 대신 버튼이 자기 배경을 갖는다.
 */
export const TopBar = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  height: 58px;
  padding: 0 ${space.md};
`;

export const CloseButton = styled.button`
  display: grid;
  width: 42px;
  height: 42px;
  padding: 0;
  color: ${color.surface};
  cursor: pointer;
  background: ${alpha(color.surface, 16)};
  border: 0;
  border-radius: ${radius.circle};
  place-items: center;

  svg {
    width: 19px;
    height: 19px;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;

export const Rail = styled.div<{ $isDragging: boolean }>`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-snap-type: ${({ $isDragging }) =>
    $isDragging ? 'none' : 'x mandatory'};
  touch-action: pan-y;
  user-select: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Slide = styled.div`
  display: grid;
  flex: 0 0 100%;
  height: 100%;
  padding: 0 ${space.md} ${space.sm};
  scroll-snap-align: start;
  scroll-snap-stop: always;
  place-items: center;
`;

/** 잘라내지 않는다. 크게 보려고 연 화면이라 사진 전체가 보여야 한다. */
export const Photo = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  user-select: none;
  object-fit: contain;
  -webkit-user-drag: none;
`;

export const Counter = styled.p`
  flex: 0 0 auto;
  padding: 0 ${space.md} 10px;
  margin: 0;
  color: ${alpha(color.surface, 78)};
  font-size: ${fontSize.sm};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

export const Strip = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 7px;
  padding: 0 ${space.md} calc(${space.lg} + env(safe-area-inset-bottom));
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const StripItem = styled.button<{ $isActive: boolean }>`
  position: relative;
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: ${alpha(color.surface, 12)};
  border: 0;
  border-radius: ${radius.sm};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /*
   * 흰 테두리만으로는 안 보인다. 가챠 사진은 배경이 밝은 것이 많아 흰 선이
   * 사진에 묻힌다. 고르지 않은 칸을 어둡게 덮어 고른 칸이 드러나게 한다.
   */
  &::after {
    position: absolute;
    inset: 0;
    content: '';
    background: ${({ $isActive }) =>
      $isActive ? 'transparent' : alpha(color.ink, 58)};
    border: 2px solid
      ${({ $isActive }) => ($isActive ? color.surface : 'transparent')};
    border-radius: ${radius.sm};
  }

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;
