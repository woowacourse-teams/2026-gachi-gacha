import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Link, useLocation, useNavigate } from 'react-router';

import { TradeDeleteDialog } from '@/domains/trade/components/TradeDeleteDialog';
import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import { TradeStatusControl } from '@/domains/trade/components/TradeStatusControl';
import type {
  TradeDetail as TradeDetailData,
  TradePlace,
} from '@/domains/trade/tradeDetailType';
import { createLoginUrl } from '@/features/auth/authReturnPath';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import type { TradeDetailAction } from '../../TradeDetailPage';

interface TradeDetailProps {
  detail: TradeDetailData;
  action?: TradeDetailAction;
}

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatPlace(place: TradePlace | null, fallback: string): string {
  return place?.name || place?.address || fallback;
}

function formatAvailableTime(availableTime: string | null): string {
  if (!availableTime) {
    return '시간 협의';
  }

  const date = new Date(availableTime);

  return Number.isNaN(date.getTime())
    ? '시간 협의'
    : dateTimeFormatter.format(date);
}

export default function TradeDetail({
  detail,
  action = 'chat',
}: TradeDetailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(detail.status);
  const selectedImageUrl = detail.imageUrls[selectedImageIndex];
  const categoryLabel = detail.categories.join(' · ') || '카테고리 미설정';

  useEffect(() => {
    setCurrentStatus(detail.status);
  }, [detail.status]);

  return (
    <Wrapper>
      <Breadcrumb>교환 · {categoryLabel}</Breadcrumb>

      <Summary>
        <Gallery>
          <MainImage>
            {selectedImageUrl ? (
              <MainPhoto src={selectedImageUrl} alt={`${detail.title} 사진`} />
            ) : (
              <LogoImagePlaceholder />
            )}
            {detail.imageUrls.length > 0 && (
              <ImageCount>
                {selectedImageIndex + 1} / {detail.imageUrls.length}
              </ImageCount>
            )}
          </MainImage>

          {detail.imageUrls.length > 1 && (
            <ThumbnailList aria-label="상품 사진 목록">
              {detail.imageUrls.map((imageUrl, index) => (
                <Thumbnail
                  key={imageUrl}
                  type="button"
                  data-selected={index === selectedImageIndex}
                  aria-label={`${index + 1}번 사진 보기`}
                  onClick={() => {
                    captureAnalyticsEvent('trade_detail_photo_selected', {
                      trade_id: detail.tradeId,
                      photo_index: index,
                      photo_count: detail.imageUrls.length,
                    });
                    setSelectedImageIndex(index);
                  }}
                >
                  <ThumbnailPhoto src={imageUrl} alt="" />
                </Thumbnail>
              ))}
            </ThumbnailList>
          )}
        </Gallery>

        <Info>
          <Title>{detail.title}</Title>
          <Meta>
            <span>{formatRelativeTime(detail.createdAt)}</span>
            {action === 'edit' ? (
              <TradeStatusControl
                tradeId={detail.tradeId}
                status={currentStatus}
                onStatusChanged={setCurrentStatus}
              />
            ) : (
              <TradeStatusBadge status={currentStatus} />
            )}
          </Meta>

          <Divider />

          <InfoList>
            <InfoRow>
              <InfoLabel>원하는 교환</InfoLabel>
              <InfoValue>{detail.desiredProduction || '제안 받아요'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>교환 장소</InfoLabel>
              <InfoValue>
                {formatPlace(detail.tradePlace, '교환 장소 협의')}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>구매 매장</InfoLabel>
              <InfoValue>
                {formatPlace(detail.purchaseStore, '구매 매장 미등록')}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>가능 시간</InfoLabel>
              <InfoValue>{formatAvailableTime(detail.availableTime)}</InfoValue>
            </InfoRow>
          </InfoList>

          <DescriptionSection>
            <SectionTitle>상품 설명</SectionTitle>
            <Description>
              {detail.description || '등록된 설명이 없어요.'}
            </Description>
            {detail.categories.length > 0 && (
              <CategoryList aria-label="카테고리">
                {detail.categories.map((category) => (
                  <Category key={category}>#{category}</Category>
                ))}
              </CategoryList>
            )}
          </DescriptionSection>

          {action && (
            <ActionGroup>
              {action === 'edit' ? (
                <OwnerActions>
                  <EditLink
                    to={`/trade/${detail.tradeId}/edit`}
                    onClick={() =>
                      captureAnalyticsEvent('trade_edit_started', {
                        trade_id: detail.tradeId,
                        source: 'trade_detail',
                      })
                    }
                  >
                    수정하기
                  </EditLink>
                  <DeleteButton
                    type="button"
                    onClick={() => {
                      captureAnalyticsEvent('trade_delete_started', {
                        trade_id: detail.tradeId,
                        source: 'trade_detail',
                      });
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    삭제
                  </DeleteButton>
                </OwnerActions>
              ) : action === 'login' ? (
                <ChatLink
                  to={createLoginUrl(`/trade/${detail.tradeId}`)}
                  onClick={() =>
                    captureAnalyticsEvent('trade_chat_started', {
                      trade_id: detail.tradeId,
                      is_authenticated: false,
                    })
                  }
                >
                  채팅하기
                </ChatLink>
              ) : (
                <ChatLink
                  to={`/chat/start/${detail.tradeId}`}
                  state={{ backgroundLocation: location }}
                  onClick={() =>
                    captureAnalyticsEvent('trade_chat_started', {
                      trade_id: detail.tradeId,
                      is_authenticated: true,
                    })
                  }
                >
                  채팅하기
                </ChatLink>
              )}
            </ActionGroup>
          )}
        </Info>
      </Summary>

      {action === 'edit' && (
        <TradeDeleteDialog
          open={isDeleteDialogOpen}
          tradeId={detail.tradeId}
          tradeTitle={detail.title}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={() => navigate('/trade', { replace: true })}
        />
      )}
    </Wrapper>
  );
}

const Wrapper = styled.article`
  padding-bottom: 56px;
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
  overflow: hidden;
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
  overflow: hidden;
  place-items: center;
  border: 1px solid #e1e1e5;
  border-radius: 10px;
  background: #f5f1ff;
  cursor: pointer;

  &[data-selected='true'] {
    border: 2px solid #ed174c;
  }
`;

const ThumbnailPhoto = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Info = styled.div`
  padding-top: 8px;
`;

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 20px;
`;

const Category = styled.span`
  color: #ed174c;
  font-size: 14px;
  font-weight: 700;
`;

const Title = styled.h1`
  margin: 0 0 12px;
  color: #202126;
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.3;
  letter-spacing: -0.04em;
`;

const Meta = styled.div`
  display: flex;
  min-height: 32px;
  margin: 0;
  align-items: center;
  gap: 9px;
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
`;

const ChatLink = styled(Link)`
  display: inline-flex;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ed174c;
  border-radius: 12px;
  background: #ffffff;
  color: #ed174c;
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
`;

const EditLink = styled(ChatLink)`
  background: #ed174c;
  color: #ffffff;
`;

const OwnerActions = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 8px;
`;

const DeleteButton = styled.button`
  min-height: 54px;
  border: 1px solid #e2dfe0;
  border-radius: 12px;
  background: #ffffff;
  color: #d80f42;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
`;

const DescriptionSection = styled.section`
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid #e9e9ec;
`;

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
