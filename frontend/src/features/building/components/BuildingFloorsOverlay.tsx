import { useState } from 'react';
import styled from '@emotion/styled';

import { useBackClose } from '@/hooks/useBackClose';
import {
  alpha,
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/styles/tokens';

import { buildingColor } from './buildingTheme';
import FloorRail from './FloorRail';
import FloorStack from './FloorStack';
import {
  DEFAULT_SELECTED_FLOOR,
  type BuildingFloor,
} from '../model/buildingFloors';
import type { GachaBuilding } from '../model/gachaBuilding';

interface BuildingFloorsOverlayProps {
  building: GachaBuilding;
  floors: readonly BuildingFloor[];
  onClose: () => void;
  /**
   * 고른 층의 지도를 열 때. 아직 갈 곳이 없으면 넘기지 않는다.
   * 그러면 버튼이 눌리지 않는 상태로 나온다.
   */
  onViewFloorMap?: (floor: number) => void;
}

export default function BuildingFloorsOverlay({
  building,
  floors,
  onClose,
  onViewFloorMap,
}: BuildingFloorsOverlayProps) {
  const [selectedFloor, setSelectedFloor] = useState(DEFAULT_SELECTED_FLOOR);
  const selected = floors.find(({ floor }) => floor === selectedFloor) ?? null;

  /**
   * 닫는 길은 하나뿐이다. 닫기 버튼도 상태를 직접 바꾸지 말고 뒤로가기를
   * 부르고, 실제로 닫는 건 `useBackClose` 가 한다. 상세 시트와 사진 뷰어가
   * 같은 규칙이라, 이 화면이 시트 위에 떠도 뒤로가기 한 번에 이것만 닫힌다.
   */
  useBackClose(true, onClose);

  const requestClose = () => history.back();

  return (
    <Backdrop onClick={requestClose}>
      {/* 카드 안을 눌렀을 때 배경의 닫기가 따라 도는 걸 막는다. */}
      <Card
        role="dialog"
        aria-modal="true"
        aria-label={`${building.name} 층 고르기`}
        onClick={(event) => event.stopPropagation()}
      >
        <Header>
          <div>
            <Title>{building.name}</Title>
            <FloorCount>총 {floors.length}개 층</FloorCount>
          </div>
          <CloseButton type="button" aria-label="닫기" onClick={requestClose}>
            ✕
          </CloseButton>
        </Header>

        <Body>
          <Stage>
            <FloorStack
              floors={floors}
              selectedFloor={selectedFloor}
              onSelect={setSelectedFloor}
            />
          </Stage>
          <FloorRail
            floors={floors}
            selectedFloor={selectedFloor}
            onSelect={setSelectedFloor}
          />
        </Body>

        <Summary>
          <SelectedFloor>{selectedFloor}층</SelectedFloor>
          {selected?.shopCount != null && (
            <>
              <Divider aria-hidden="true">|</Divider>
              <span>가챠샵 {selected.shopCount}개</span>
            </>
          )}
          <ViewMapButton
            type="button"
            disabled={onViewFloorMap === undefined}
            onClick={() => onViewFloorMap?.(selectedFloor)}
          >
            지도 보기 ›
          </ViewMapButton>
        </Summary>
      </Card>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${space.md};
  background-color: ${alpha(color.ink, 50)};
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: ${radius.lg};
  background-color: ${color.surface};
  box-shadow: ${shadow.sheet};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${space.sm};
  padding: ${space.lg} ${space.lg} ${space.xs};
`;

const Title = styled.h2`
  margin: 0;
  color: ${color.ink};
  font-size: ${fontSize.xl};
  font-weight: ${fontWeight.bold};
`;

const FloorCount = styled.p`
  margin: 4px 0 0;
  color: ${color.ink3};
  font-size: ${fontSize.md};
`;

const CloseButton = styled.button`
  width: 44px;
  min-height: 44px;
  margin-left: auto;
  border: 0;
  background: none;
  color: ${color.ink};
  cursor: pointer;
  font-size: ${fontSize.lg};

  &:focus-visible {
    outline: 3px solid ${buildingColor.accent};
    outline-offset: 2px;
  }
`;

const Body = styled.div`
  display: flex;
  flex: 1 1 auto;
  gap: ${space.xs};
  align-items: center;
  min-height: 0;
  padding: 0 ${space.md} ${space.sm};
`;

const Stage = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 100%;
`;

const Summary = styled.div`
  display: flex;
  gap: ${space.xs};
  align-items: center;
  margin: 0 ${space.md} ${space.md};
  padding: ${space.sm} ${space.sm} ${space.sm} ${space.md};
  border-radius: ${radius.md};
  background-color: ${color.surface2};
  color: ${color.ink};
  font-size: ${fontSize.md};
`;

const SelectedFloor = styled.strong`
  color: ${buildingColor.accent};
  font-size: ${fontSize.lg};
`;

const Divider = styled.span`
  color: ${color.line};
`;

const ViewMapButton = styled.button`
  min-height: 44px;
  margin-left: auto;
  padding: 10px 18px;
  border: 0;
  border-radius: ${radius.md};
  background-color: ${buildingColor.accent};
  color: ${color.surface};
  cursor: pointer;
  font-weight: ${fontWeight.bold};

  &:disabled {
    background-color: ${color.ink3};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 3px solid ${buildingColor.accent};
    outline-offset: 2px;
  }
`;
