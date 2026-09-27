import styled from '@emotion/styled';

interface TradingToolbarProps {
  neighborhood: string;
  address: string;
}

export default function TradingToolbar({
  neighborhood,
  address,
}: TradingToolbarProps) {
  return (
    <Wrapper>
      <HeadingRow>
        <Title>
          <BagIcon aria-hidden="true" />
          {neighborhood} 중고거래 검색 결과
        </Title>
        <Address>{address}</Address>
      </HeadingRow>

      <Actions>
        <LeftActions>
          <ActionButton type="button">
            <FilterIcon aria-hidden="true" />
            필터
          </ActionButton>
          <Divider />
          <ActionButton type="button">지역 선택</ActionButton>
          <LocationButton type="button">
            <LocationIcon aria-hidden="true" />
            현재 위치로 설정
          </LocationButton>
        </LeftActions>

        <ActionButton type="button">
          <MapIcon aria-hidden="true" />
          지도에서 보기
        </ActionButton>
      </Actions>
    </Wrapper>
  );
}

function BagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" {...props}>
      <path d="M5 7.5h14l-1 13H6l-1-13Z" fill="#F47A33" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#FFB24F" strokeWidth="2" />
      <path
        d="M9.5 11.5a2.5 2.5 0 0 0 5 0"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <path
        d="M4 7h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="9"
        cy="7"
        r="2"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="15"
        cy="17"
        r="2"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function LocationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      {...props}
    >
      <path d="m3 5 5-2 8 2 5-2v16l-5 2-8-2-5 2V5Zm6 .2v11.9l6 1.5V6.7L9 5.2Z" />
    </svg>
  );
}

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #1e1f23;
  font-size: clamp(24px, 2.3vw, 36px);
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const Address = styled.p`
  margin: 0;
  color: #686d78;
  font-size: 18px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 720px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const LeftActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border: 1px solid #eeeef0;
  border-radius: 12px;
  background: #ffffff;
  color: #27282d;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
`;

const LocationButton = styled(ActionButton)`
  border-color: #33363d;
  background: #33363d;
  color: #ffffff;

  @media (max-width: 720px) {
    grid-column: 1 / -1;
  }
`;

const Divider = styled.span`
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background: #dcdde1;

  @media (max-width: 720px) {
    display: none;
  }
`;
