import styled from '@emotion/styled';

import { color, fontWeight, radius } from '@/styles/tokens';

import { buildingColor } from './buildingTheme';
import type { BuildingFloor } from '../model/buildingFloors';

interface FloorRailProps {
  floors: readonly BuildingFloor[];
  selectedFloor: number;
  onSelect: (floor: number) => void;
}

export default function FloorRail({
  floors,
  selectedFloor,
  onSelect,
}: FloorRailProps) {
  // 위층이 위에 오도록 뒤집는다. 쌓인 판과 순서가 같아야 눈이 따라간다.
  const ordered = [...floors].sort((a, b) => b.floor - a.floor);

  return (
    <Rail aria-label="층 고르기">
      {ordered.map(({ floor }) => (
        <FloorButton
          key={floor}
          type="button"
          aria-pressed={floor === selectedFloor}
          data-selected={floor === selectedFloor}
          onClick={() => onSelect(floor)}
        >
          {floor}F
        </FloorButton>
      ))}
    </Rail>
  );
}

const Rail = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
`;

const FloorButton = styled.button`
  position: relative;
  width: 60px;
  min-height: 44px;
  padding: 10px 0;
  border: 0;
  border-radius: ${radius.md};
  background-color: ${color.surface2};
  color: ${color.ink};
  cursor: pointer;

  &[data-selected='true'] {
    background-color: ${buildingColor.accent};
    color: ${color.surface};
    font-weight: ${fontWeight.bold};

    /* 고른 층과 판을 잇는 꼬리. */
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: -5px;
      border: 6px solid transparent;
      border-left: 0;
      border-right-color: ${buildingColor.accent};
      transform: translateY(-50%);
    }
  }

  &:focus-visible {
    outline: 3px solid ${buildingColor.accent};
    outline-offset: 2px;
  }
`;
