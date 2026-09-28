import { useState } from 'react';
import styled from '@emotion/styled';

import type { SecondhandDetail } from '../../model/secondhandDetail';

interface TradeDetailProps {
  detail: SecondhandDetail;
  onChatClick: () => void;
}

export default function TradeDetail({ detail, onChatClick }: TradeDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImageUrl = detail.imageUrls[selectedImageIndex];

  return (
    <Wrapper>
      <Breadcrumb>중고거래 · {detail.category}</Breadcrumb>

      <Summary>
        <Gallery>
          <MainImage>
            {selectedImageUrl ? (
              <MainPhoto src={selectedImageUrl} alt={`${detail.title} 사진`} />
            ) : (
              <ImagePlaceholder>이미지 없음</ImagePlaceholder>
            )}
            {detail.imageUrls.length > 0 && (
              <ImageCount>
                {selectedImageIndex + 1} / {detail.imageUrls.length}
              </ImageCount>
            )}
          </MainImage>

          <ThumbnailList aria-label="상품 사진 목록">
            {detail.imageUrls.map((imageUrl, index) => (
              <Thumbnail
                key={imageUrl}
                type="button"
                data-selected={index === selectedImageIndex}
                aria-label={`${index + 1}번 사진 보기`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <ThumbnailPhoto src={imageUrl} alt="" />
              </Thumbnail>
            ))}
          </ThumbnailList>
        </Gallery>

        <Info>
          <Category>{detail.category}</Category>
          <Title>{detail.title}</Title>
          <Meta>
            {detail.postedAt} · 조회 {detail.viewCount} · 찜 {detail.wishCount}
          </Meta>

          <Divider />

          <InfoList>
            <InfoRow>
              <InfoLabel>원하는 교환</InfoLabel>
              <InfoValue>{detail.wantedTrade}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>교환 장소</InfoLabel>
              <InfoValue>📍 {detail.place}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>가능 시간</InfoLabel>
              <InfoValue>🕒 {detail.availableTime}</InfoValue>
            </InfoRow>
          </InfoList>

          <ActionGroup>
            <WishButton type="button" aria-label="찜하기">
              ♡
            </WishButton>
            <ChatButton type="button" onClick={onChatClick}>
              채팅하기
            </ChatButton>
            <TradeButton type="button">교환 제안하기</TradeButton>
          </ActionGroup>
        </Info>
      </Summary>

      <BodyGrid>
        <DescriptionSection>
          <SectionTitle>상품 설명</SectionTitle>
          <Description>{detail.description}</Description>
        </DescriptionSection>

        <SellerCard>
          <SellerHeading>교환자 정보</SellerHeading>
          <SellerProfile>
            <Avatar aria-hidden="true">가</Avatar>
            <div>
              <SellerName>{detail.seller.nickname}</SellerName>
              <SellerMeta>
                {detail.seller.neighborhood} · 거래{' '}
                {detail.seller.completedTradeCount}회
              </SellerMeta>
            </div>
          </SellerProfile>
          <SellerButton type="button">교환 목록 보기</SellerButton>
        </SellerCard>
      </BodyGrid>
    </Wrapper>
  );
}

const Wrapper = styled.article`
  padding-bottom: 56px;
  border-bottom: 1px solid #e9e9ec;
`;

const Breadcrumb = styled.p`
  margin: 0 0 20px;
  color: #888a93;
  font-size: 14px;
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  gap: 56px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const Gallery = styled.div`
  min-width: 0;
`;

const MainImage = styled.div`
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
  place-items: center;
  border: 1px solid #ececef;
  border-radius: 20px;
  background: #f3f3f5;
`;

const MainPhoto = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.span`
  color: #9799a2;
  font-size: 15px;
`;

const ImageCount = styled.span`
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgb(29 30 34 / 70%);
  color: #ffffff;
  font-size: 12px;
`;

const ThumbnailList = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
`;

const Thumbnail = styled.button`
  display: grid;
  width: 64px;
  height: 64px;
  padding: 0;
  place-items: center;
  border: 1px solid #e1e1e5;
  border-radius: 10px;
  background: #f5f1ff;
  font-size: 28px;
  cursor: pointer;

  &[data-selected='true'] {
    border: 2px solid #ed174c;
  }
`;

const ThumbnailPhoto = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
`;

const Info = styled.div`
  padding-top: 8px;
`;

const Category = styled.span`
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff0f4;
  color: #ed174c;
  font-size: 13px;
  font-weight: 700;
`;

const Title = styled.h1`
  margin: 16px 0 12px;
  color: #202126;
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.3;
  letter-spacing: -0.04em;
`;

const Meta = styled.p`
  margin: 0;
  color: #898b94;
  font-size: 14px;
`;

const Divider = styled.hr`
  margin: 28px 0;
  border: 0;
  border-top: 1px solid #ececef;
`;

const InfoList = styled.dl`
  display: flex;
  margin: 0;
  flex-direction: column;
  gap: 18px;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 16px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 4px;
  }
`;

const InfoLabel = styled.dt`
  color: #888a93;
  font-size: 14px;
`;

const InfoValue = styled.dd`
  margin: 0;
  color: #292a2f;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
`;

const ActionGroup = styled.div`
  display: grid;
  margin-top: 32px;
  grid-template-columns: 54px 1fr 1.4fr;
  gap: 10px;

  @media (max-width: 520px) {
    grid-template-columns: 48px 1fr;
  }
`;

const ActionButton = styled.button`
  min-height: 54px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
`;

const WishButton = styled(ActionButton)`
  border: 1px solid #dfe0e4;
  background: #ffffff;
  color: #5c5e66;
  font-size: 28px;
`;

const ChatButton = styled(ActionButton)`
  border: 1px solid #ed174c;
  background: #ffffff;
  color: #ed174c;
`;

const TradeButton = styled(ActionButton)`
  border: 1px solid #ed174c;
  background: #ed174c;
  color: #ffffff;

  @media (max-width: 520px) {
    grid-column: 1 / -1;
  }
`;

const BodyGrid = styled.div`
  display: grid;
  margin-top: 48px;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 64px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const DescriptionSection = styled.section``;

const SectionTitle = styled.h2`
  margin: 0 0 20px;
  color: #27282d;
  font-size: 20px;
`;

const Description = styled.p`
  margin: 0;
  color: #565861;
  font-size: 15px;
  line-height: 1.9;
  white-space: pre-line;
`;

const SellerCard = styled.aside`
  align-self: start;
  padding: 22px;
  border: 1px solid #e7e7ea;
  border-radius: 16px;
`;

const SellerHeading = styled.h2`
  margin: 0 0 18px;
  color: #292a2f;
  font-size: 17px;
`;

const SellerProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #fff0f4;
  color: #ed174c;
  font-weight: 800;
`;

const SellerName = styled.p`
  margin: 0 0 4px;
  color: #292a2f;
  font-size: 15px;
  font-weight: 800;
`;

const SellerMeta = styled.p`
  margin: 0;
  color: #858790;
  font-size: 13px;
`;

const SellerButton = styled.button`
  width: 100%;
  min-height: 42px;
  margin-top: 18px;
  border: 1px solid #dedfe3;
  border-radius: 10px;
  background: #ffffff;
  color: #484a52;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;
