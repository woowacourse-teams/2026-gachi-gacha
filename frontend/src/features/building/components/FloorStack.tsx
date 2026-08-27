import styled from '@emotion/styled';

import { buildingColor } from './buildingTheme';
import floorPlanPlaceholder from '../assets/floorPlanPlaceholder.webp';
import {
  FLOOR_OUTLINE_PATH,
  FLOOR_OUTLINE_SIZE,
  type BuildingFloor,
} from '../model/buildingFloors';

/**
 * 층 판을 아래에서 위로 쌓아 보여 준다.
 *
 * 판을 눕혀 보이게 하는 값들. 판 하나를 가로로 밀면서 세로로 눌러 비스듬히
 * 놓고, 층마다 위로 띄운다. 값이 같이 움직여야 모양이 유지되므로 한곳에 둔다.
 */
const SHEAR = 0.34;
const SQUASH = 0.42;
/** 층 사이 간격. 판 두께(THICKNESS)보다 커야 아래 층이 보인다. */
const GAP = 118;
/** 판 옆면 두께. 이만큼 아래로 한 번 더 그려 옆면을 만든다. */
const THICKNESS = 16;

/** 고른 층은 앞으로 빼내서 다른 층에 가리지 않게 한다. */
const SELECTED_OFFSET_X = -46;

/** 고른 층 테두리가 가장 굵다. 그 절반이 판 밖으로 나가므로 여백에 더한다. */
const MAX_STROKE_WIDTH = 18;

interface FloorStackProps {
  floors: readonly BuildingFloor[];
  selectedFloor: number;
  onSelect: (floor: number) => void;
}

export default function FloorStack({
  floors,
  selectedFloor,
  onSelect,
}: FloorStackProps) {
  const { width, height } = FLOOR_OUTLINE_SIZE;
  // 1층이 맨 아래, 꼭대기 층이 맨 위에 오도록 아래에서부터 쌓는다.
  const ordered = [...floors].sort((a, b) => a.floor - b.floor);
  const topIndex = ordered.length - 1;

  /*
   * 그려지는 것에 딱 맞는 상자를 계산한다. 손으로 적으면 각도나 간격을
   * 바꿀 때마다 여백이 어긋나서, 판이 한쪽으로 쏠리거나 잘린다.
   *
   * 눕히는 변환은 x' = x + SHEAR*y, y' = SQUASH*y 다. 그래서 가로는 판
   * 세로만큼 오른쪽으로 더 번지고, 세로는 SQUASH 배로 눌린다.
   */
  const pad = MAX_STROKE_WIDTH / 2;
  const boxWidth = width + height * SHEAR - SELECTED_OFFSET_X + pad * 2;
  const boxHeight = height * SQUASH + topIndex * GAP + THICKNESS + pad * 2;

  return (
    <Svg
      viewBox={`${SELECTED_OFFSET_X - pad} ${-pad} ${boxWidth} ${boxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
    >
      <defs>
        <clipPath id="floor-plate-clip">
          <path d={FLOOR_OUTLINE_PATH} />
        </clipPath>
        {/* 판마다 바로 아래 판에 그림자를 떨어뜨려 쌓인 느낌을 만든다. */}
        <filter
          id="floor-plate-shadow"
          x="-10%"
          y="-10%"
          width="130%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="14"
            stdDeviation="16"
            floodColor="#2b3040"
            floodOpacity="0.18"
          />
        </filter>
      </defs>

      {ordered.map((floor, index) => {
        const isSelected = floor.floor === selectedFloor;
        const y = (topIndex - index) * GAP;
        const x = isSelected ? SELECTED_OFFSET_X : 0;

        return (
          <Plate
            key={floor.floor}
            transform={`translate(${x} ${y})`}
            data-selected={isSelected}
            filter="url(#floor-plate-shadow)"
            onClick={() => onSelect(floor.floor)}
            aria-label={`${floor.floor}층`}
          >
            <g transform={`matrix(1 0 ${SHEAR} ${SQUASH} 0 0)`}>
              {/* 옆면을 먼저 그려 윗면이 그 위에 덮이게 한다. */}
              <path
                className="side"
                d={FLOOR_OUTLINE_PATH}
                transform={`translate(0 ${THICKNESS / SQUASH})`}
              />
              <path className="top" d={FLOOR_OUTLINE_PATH} />
              <image
                className="plan"
                href={floor.plateSrc ?? floorPlanPlaceholder}
                x={0}
                y={0}
                width={width}
                height={height}
                clipPath="url(#floor-plate-clip)"
                preserveAspectRatio="none"
              />
              {/* 테두리는 도면 위에 그린다. 먼저 그리면 안쪽 절반이 덮인다. */}
              <path className="edge" d={FLOOR_OUTLINE_PATH} />
            </g>
          </Plate>
        );
      })}
    </Svg>
  );
}

const Svg = styled.svg`
  width: 100%;
  height: 100%;
`;

const Plate = styled.g`
  cursor: pointer;

  .side {
    fill: ${buildingColor.plateEdge};
  }

  .top {
    fill: ${buildingColor.plate};
  }

  .edge {
    fill: none;
    stroke: ${buildingColor.plateLine};
    stroke-width: 7;
    stroke-linejoin: round;
  }

  /*
   * 도면은 옅게 깔아 둔다. 판을 반투명하게 만들면 아래 층이 비쳐서 쌓인
   * 것처럼 안 보이고 지저분해지므로, 판은 불투명하게 두고 도면 진하기만
   * 조절한다.
   */
  .plan {
    opacity: 0.22;
  }

  &[data-selected='true'] {
    .side {
      fill: ${buildingColor.accentEdge};
    }

    .top {
      fill: ${buildingColor.accentSurface};
    }

    .edge {
      stroke: ${buildingColor.accent};
      stroke-width: ${MAX_STROKE_WIDTH};
    }

    .plan {
      opacity: 0.95;
    }
  }
`;
