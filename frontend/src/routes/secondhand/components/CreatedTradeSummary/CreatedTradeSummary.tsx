import styled from '@emotion/styled';

import type { CreatedTrade } from '../../model/createdTrade';

interface CreatedTradeSummaryProps {
  trade: CreatedTrade;
}

export default function CreatedTradeSummary({
  trade,
}: CreatedTradeSummaryProps) {
  return (
    <Card>
      <Thumbnail>
        {trade.imageUrl ? (
          <Image src={trade.imageUrl} alt="" />
        ) : (
          <ImagePlaceholder>🎁</ImagePlaceholder>
        )}
      </Thumbnail>

      <Content>
        <Title>{trade.title}</Title>
        <Meta>
          {trade.place} · {trade.availableTime}
        </Meta>
        <WantedTrade>{trade.wantedTrade}</WantedTrade>
      </Content>
    </Card>
  );
}

const Card = styled.article`
  display: flex;
  box-sizing: border-box;
  width: 100%;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid #e3e3e7;
  border-radius: 16px;
  background: #ffffff;
  text-align: left;

  @media (max-width: 480px) {
    padding: 14px;
  }
`;

const Thumbnail = styled.div`
  display: grid;
  width: 88px;
  height: 88px;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border-radius: 12px;
  background: #f3efff;

  @media (max-width: 480px) {
    width: 72px;
    height: 72px;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.span`
  font-size: 36px;
`;

const Content = styled.div`
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0 0 7px;
  overflow: hidden;
  color: #292a2f;
  font-size: 17px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.p`
  margin: 0 0 7px;
  overflow: hidden;
  color: #858790;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const WantedTrade = styled.p`
  margin: 0;
  overflow: hidden;
  color: #ed174c;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
