import { useCallback, useState } from 'react';
import styled from '@emotion/styled';
import { Link, useLocation, useNavigate } from 'react-router';

import { TradeDeleteDialog } from '@/domains/trade/components/TradeDeleteDialog';
import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import type {
  TradeDetail as TradeDetailData,
  TradePlace,
} from '@/domains/trade/tradeDetailType';
import { createLoginUrl } from '@/features/auth/authReturnPath';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';
import {
  PhotoViewer,
  type PhotoViewerNavigationSource,
} from '@/shared/ui/PhotoViewer';

import type { TradeDetailAction } from '../../TradeDetailPage';

interface TradeDetailProps {
  detail: TradeDetailData;
  action?: TradeDetailAction;
  hasSubmittedComment?: boolean;
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
  hasSubmittedComment = false,
}: TradeDetailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImageUrl = detail.imageUrls[selectedImageIndex];
  const categoryLabel = detail.categories.join(' · ') || '카테고리 미설정';
  const closePhotoViewer = useCallback(() => setIsPhotoViewerOpen(false), []);

  function selectImage(
    index: number,
    source: 'gallery_previous' | 'gallery_next' | 'thumbnail',
  ) {
    captureAnalyticsEvent('trade_detail_photo_selected', {
      trade_id: detail.tradeId,
      photo_index: index,
      photo_count: detail.imageUrls.length,
      source,
    });
    setSelectedImageIndex(index);
  }

  const changeViewerImage = useCallback(
    (index: number, source: PhotoViewerNavigationSource) => {
      setSelectedImageIndex(index);

      if (source === 'initial') {
        return;
      }

      const analyticsSource = {
        previous_button: 'viewer_previous',
        next_button: 'viewer_next',
        thumbnail: 'viewer_thumbnail',
        scroll: 'viewer_scroll',
      }[source] as
        | 'viewer_previous'
        | 'viewer_next'
        | 'viewer_thumbnail'
        | 'viewer_scroll';

      captureAnalyticsEvent('trade_detail_photo_selected', {
        trade_id: detail.tradeId,
        photo_index: index,
        photo_count: detail.imageUrls.length,
        source: analyticsSource,
      });
    },
    [detail.imageUrls.length, detail.tradeId],
  );

  return (
    <Wrapper>
      <Breadcrumb>교환 · {categoryLabel}</Breadcrumb>

      <Summary>
        <Gallery>
          <MainImage>
            {selectedImageUrl ? (
              <MainPhotoButton
                type="button"
                aria-label={`${selectedImageIndex + 1}번째 상품 사진 크게 보기`}
                onClick={() => {
                  captureAnalyticsEvent('trade_detail_photo_viewer_opened', {
                    trade_id: detail.tradeId,
                    photo_index: selectedImageIndex,
                    photo_count: detail.imageUrls.length,
                  });
                  setIsPhotoViewerOpen(true);
                }}
              >
                <MainPhoto
                  src={selectedImageUrl}
                  alt={`${detail.title} 상품 사진 ${selectedImageIndex + 1}`}
                  loading="eager"
                  decoding="async"
                />
              </MainPhotoButton>
            ) : (
              <LogoImagePlaceholder />
            )}
            {detail.imageUrls.length > 1 && (
              <>
                <GalleryDirectionButton
                  $direction="previous"
                  type="button"
                  aria-label="이전 상품 사진"
                  disabled={selectedImageIndex === 0}
                  onClick={() =>
                    selectImage(selectedImageIndex - 1, 'gallery_previous')
                  }
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m12 5-5 5 5 5" />
                  </svg>
                </GalleryDirectionButton>
                <GalleryDirectionButton
                  $direction="next"
                  type="button"
                  aria-label="다음 상품 사진"
                  disabled={selectedImageIndex === detail.imageUrls.length - 1}
                  onClick={() =>
                    selectImage(selectedImageIndex + 1, 'gallery_next')
                  }
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m8 5 5 5-5 5" />
                  </svg>
                </GalleryDirectionButton>
              </>
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
                  aria-current={
                    index === selectedImageIndex ? 'true' : undefined
                  }
                  onClick={() => selectImage(index, 'thumbnail')}
                >
                  <ThumbnailPhoto
                    src={imageUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </Thumbnail>
              ))}
            </ThumbnailList>
          )}
        </Gallery>

        <Info>
          <Title>{detail.title}</Title>
          <Meta>
            <span>{formatRelativeTime(detail.createdAt)}</span>
            <TradeStatusBadge status={detail.status} />
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
                      comment_context: hasSubmittedComment
                        ? 'submitted_this_session'
                        : 'none',
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
                      comment_context: hasSubmittedComment
                        ? 'submitted_this_session'
                        : 'none',
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

      {isPhotoViewerOpen && selectedImageUrl && (
        <PhotoViewer
          imageUrls={detail.imageUrls}
          initialIndex={selectedImageIndex}
          title={detail.title}
          dialogLabel={`${detail.title} 상품 사진 크게 보기`}
          imageAltPrefix={`${detail.title} 상품 사진`}
          thumbnailListLabel="상품 사진 목록"
          closeLabel="상품 사진 크게 보기 닫기"
          onClose={closePhotoViewer}
          onActiveIndexChange={changeViewerImage}
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

const MainPhotoButton = styled.button`
  position: absolute;
  display: grid;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  inset: 0;
  place-items: center;

  &:focus-visible {
    z-index: 1;
    outline: 3px solid rgb(237 23 76 / 28%);
    outline-offset: -4px;
  }
`;

const MainPhoto = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const GalleryDirectionButton = styled.button<{
  $direction: 'previous' | 'next';
}>`
  position: absolute;
  z-index: 2;
  top: 50%;
  ${({ $direction }) =>
    $direction === 'previous' ? 'left: 14px;' : 'right: 14px;'}
  display: grid;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 72%);
  border-radius: 50%;
  background: rgb(255 255 255 / 88%);
  box-shadow: 0 4px 14px rgb(29 30 34 / 16%);
  color: #242122;
  cursor: pointer;
  place-items: center;
  transform: translateY(-50%);

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  &:focus-visible {
    outline: 3px solid rgb(237 23 76 / 28%);
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  @media (max-width: 520px) {
    ${({ $direction }) =>
      $direction === 'previous' ? 'left: 8px;' : 'right: 8px;'}
    width: 38px;
    height: 38px;
  }
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
