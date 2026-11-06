import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from '@emotion/styled';
import { Link, useLocation, useNavigate } from 'react-router';

import { TradeDeleteDialog } from '@/domains/trade/components/TradeDeleteDialog';
import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import type {
  TradeDetail as TradeDetailData,
  TradePlace,
} from '@/domains/trade/tradeDetailType';
import {
  TRADE_STATUSES,
  type TradeStatus,
} from '@/domains/trade/tradeSummaryType';
import { createLoginUrl } from '@/features/auth/authReturnPath';
import { UserSafetyMenu } from '@/features/memberSafety/UserSafetyMenu';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';
import {
  PhotoViewer,
  type PhotoViewerNavigationSource,
} from '@/shared/ui/PhotoViewer';

import type { TradeCommentAuthor } from '../../model/tradeComment';
import type { TradeDetailAction } from '../../TradeDetailPage';

interface TradeDetailProps {
  detail: TradeDetailData;
  comments?: ReactNode;
  action?: TradeDetailAction;
  owner?: TradeCommentAuthor | null;
  commentCount?: number | null;
  onChangeStatus?: ((status: TradeStatus) => Promise<void>) | undefined;
  hasSubmittedComment?: boolean;
  showSafetyActions?: boolean;
  onAuthorBlocked?: (() => void) | undefined;
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
  comments,
  action = 'chat',
  owner = null,
  commentCount = null,
  onChangeStatus,
  hasSubmittedComment = false,
  showSafetyActions = false,
  onAuthorBlocked,
}: TradeDetailProps) {
  const [isOwnerMenuOpen, setIsOwnerMenuOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const ownerMenu = useRef<HTMLDivElement>(null);
  const statusButton = useRef<HTMLButtonElement>(null);
  const ownerMenuButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImageUrl = detail.imageUrls[selectedImageIndex];
  const categoryLabel = detail.categories.join(' · ') || '카테고리 미설정';
  const closePhotoViewer = useCallback(() => setIsPhotoViewerOpen(false), []);

  useEffect(() => {
    if (!isOwnerMenuOpen) return;

    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !ownerMenu.current?.contains(event.target)
      ) {
        setIsOwnerMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [isOwnerMenuOpen]);

  async function changeStatus(status: TradeStatus) {
    if (!onChangeStatus || isChangingStatus) return;

    setIsChangingStatus(true);
    setStatusError(null);

    try {
      await onChangeStatus(status);
      setIsStatusOpen(false);
      statusButton.current?.focus();
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : '교환 상태를 변경하지 못했습니다.',
      );
    } finally {
      setIsChangingStatus(false);
    }
  }

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
    <Wrapper data-owner={action === 'edit' || undefined}>
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
          {action !== 'edit' && <Breadcrumb>교환 · {categoryLabel}</Breadcrumb>}
          <InfoHeader>
            {action === 'edit' && (
              <Breadcrumb>교환 · {categoryLabel}</Breadcrumb>
            )}
            {action !== 'edit' && <ItemRole>가지고 있는 것</ItemRole>}
            {action === 'edit' && (
              <OwnerMenu
                ref={ownerMenu}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsOwnerMenuOpen(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsOwnerMenuOpen(false);
                    ownerMenuButton.current?.focus();
                  }
                }}
              >
                <OwnerMenuButton
                  ref={ownerMenuButton}
                  type="button"
                  aria-label="내 글 더보기"
                  aria-expanded={isOwnerMenuOpen}
                  onClick={() => setIsOwnerMenuOpen((open) => !open)}
                >
                  <span aria-hidden="true">···</span>
                </OwnerMenuButton>
                {isOwnerMenuOpen && (
                  <OwnerMenuItems>
                    <Link
                      to={`/trade/${detail.tradeId}/edit`}
                      onClick={() =>
                        captureAnalyticsEvent('trade_edit_started', {
                          trade_id: detail.tradeId,
                          source: 'trade_detail',
                        })
                      }
                    >
                      수정하기
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        captureAnalyticsEvent('trade_delete_started', {
                          trade_id: detail.tradeId,
                          source: 'trade_detail',
                        });
                        setIsOwnerMenuOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      삭제
                    </button>
                  </OwnerMenuItems>
                )}
              </OwnerMenu>
            )}
            {showSafetyActions && (
              <UserSafetyMenu
                targetMemberId={detail.memberId}
                targetNickname="게시글 작성자"
                source="trade"
                referenceId={String(detail.tradeId)}
                onBlocked={onAuthorBlocked}
              />
            )}
          </InfoHeader>
          <Title>{detail.title}</Title>
          {action === 'edit' && (
            <OwnerIdentity>
              <OwnerAvatar>
                {owner?.profileImageUrl ? (
                  <img src={owner.profileImageUrl} alt="" />
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <circle cx="10" cy="6" r="3" />
                    <path d="M4 17v-1a6 6 0 0 1 12 0v1z" />
                  </svg>
                )}
              </OwnerAvatar>
              {owner?.nickname && <strong>{owner.nickname}</strong>}
              <OwnerTag>내 글</OwnerTag>
            </OwnerIdentity>
          )}
          <Meta>
            {action === 'edit' && <TradeStatusBadge status={detail.status} />}
            <span>
              {formatRelativeTime(detail.createdAt)}
              {action === 'edit' &&
                commentCount !== null &&
                ` · 댓글 ${commentCount}`}
            </span>
            {action !== 'edit' && <TradeStatusBadge status={detail.status} />}
          </Meta>

          <Divider />

          <InfoList>
            <OfferedItem>
              <InfoLabel>가지고 있는 것</InfoLabel>
              <InfoValue>{detail.title}</InfoValue>
              {action === 'edit' && (
                <ExchangeIcon aria-hidden="true">⇄</ExchangeIcon>
              )}
            </OfferedItem>
            <InfoRow data-desired-item>
              <InfoLabel>얻고 싶은 것</InfoLabel>
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
            <InfoRow
              data-empty-owner-time={
                (action === 'edit' && !detail.availableTime) || undefined
              }
            >
              <InfoLabel>가능 시간</InfoLabel>
              <InfoValue>{formatAvailableTime(detail.availableTime)}</InfoValue>
            </InfoRow>
          </InfoList>

          {action && (action !== 'edit' || onChangeStatus) && (
            <ActionGroup>
              {action === 'edit' ? (
                <>
                  <StatusButton
                    ref={statusButton}
                    type="button"
                    aria-expanded={isStatusOpen}
                    aria-busy={isChangingStatus}
                    aria-disabled={isChangingStatus}
                    onClick={() => {
                      if (isChangingStatus) return;
                      setStatusError(null);
                      setIsStatusOpen((open) => !open);
                    }}
                  >
                    {isChangingStatus ? '변경 중...' : '상태 변경'}
                  </StatusButton>
                  {isStatusOpen && (
                    <StatusChoices role="group" aria-label="교환 상태 선택">
                      {TRADE_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={
                            isChangingStatus || status === detail.status
                          }
                          onClick={() => void changeStatus(status)}
                        >
                          <TradeStatusBadge status={status} />
                        </button>
                      ))}
                      {statusError && <p role="alert">{statusError}</p>}
                    </StatusChoices>
                  )}
                </>
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

        <DetailContent>
          <DescriptionSection>
            <SectionTitle>가지고 있는 상품 설명</SectionTitle>
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
          {comments}
        </DetailContent>
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
  position: relative;
  padding-bottom: 56px;

  @media (min-width: 901px) {
    &[data-owner] {
      margin-bottom: 56px;
      padding-bottom: 0;
    }
  }
`;

const Breadcrumb = styled.p`
  margin: 0 0 20px;
  color: #888a93;
  font-size: 14px;
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  grid-template-areas: 'gallery info' 'content info';
  gap: 40px 48px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'gallery' 'info' 'content';
    gap: 20px;
  }
`;

const Gallery = styled.div`
  grid-area: gallery;
  min-width: 0;
`;

const MainImage = styled.div`
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;

  @media (max-width: 767px) {
    aspect-ratio: 390 / 340;
    border: 0;
    border-radius: 0;
  }

  @media (min-width: 901px) {
    aspect-ratio: 672 / 560;
  }
  overflow: hidden;
  place-items: center;
  border: 1px solid #ececef;

  @media (min-width: 901px) {
    [data-owner] & {
      box-sizing: border-box;
      border-radius: 12px;
      background: #fff;
    }
  }

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
  grid-area: info;
  padding-top: 8px;

  @media (max-width: 767px) {
    padding: 0 24px 20px;
  }
`;

const InfoHeader = styled.div`
  [data-owner] & {
    min-height: 32px;
    align-items: center;

    > p:first-child {
      margin: 0;
    }
  }

  display: flex;
  min-height: 36px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ItemRole = styled.p`
  margin: 0 0 8px;
  color: #ed174c;
  font-size: 14px;
  font-weight: 800;
  @media (max-width: 767px) {
    display: none;
  }
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
  @media (min-width: 901px) {
    [data-owner] & {
      margin: 12px 0 20px;
      font-size: 30px;
    }
  }

  margin: 0 0 12px;
  color: #202126;
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.3;
  letter-spacing: -0.04em;
`;

const OwnerIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #292a2f;
  font-size: 15px;
`;

const OwnerAvatar = styled.span`
  display: grid;
  width: 28px;
  height: 28px;
  overflow: hidden;
  place-items: center;
  border-radius: 50%;
  background: #f3f1ef;
  color: #77737a;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const OwnerTag = styled.span`
  padding: 3px 8px;
  border-radius: 999px;
  background: #f3f1ef;
  color: #77737a;
  font-size: 12px;
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

  @media (min-width: 901px) {
    [data-owner] & {
      margin: 20px 0 0;
      border: 0;
    }
  }

  @media (max-width: 767px) {
    margin: 16px 0;
  }
`;

const InfoList = styled.dl`
  display: flex;
  margin: 0;
  flex-direction: column;
  gap: 18px;

  @media (min-width: 901px) {
    [data-owner] & {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 0;

      > div {
        grid-column: 1 / -1;
        grid-template-columns: auto minmax(0, 1fr);

        > dd {
          text-align: right;
        }
      }

      > div:first-child,
      > [data-desired-item] {
        display: grid;
        grid-column: auto;
        grid-template-columns: minmax(0, 1fr);
        align-content: start;
        gap: 4px;
        padding: 20px;
        background: #faf9f8;

        > dt {
          color: #d73352;
        }

        > dd {
          font-size: 17px;
          text-align: left;
        }
      }

      > div:first-child {
        padding-right: 26px;
        border-radius: 12px 0 0 12px;
      }

      > [data-desired-item] {
        padding-left: 26px;
        border-radius: 0 12px 12px 0;
      }

      > [data-empty-owner-time] {
        display: none;
      }
    }
  }

  @media (max-width: 767px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 0;

    > div {
      grid-column: 1 / -1;
    }

    > div:first-child,
    > [data-desired-item] {
      display: grid;
      grid-column: auto;
      grid-template-columns: minmax(0, 1fr);
      align-content: start;
      min-height: 75px;
      padding: 16px;
      gap: 4px;
      background: #f7f5f4;

      > dd {
        text-align: left;
      }
    }

    > div:first-child {
      border-radius: 12px 0 0 12px;
    }

    > [data-desired-item] {
      border-radius: 0 12px 12px 0;
    }
  }
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 16px;

  @media (max-width: 767px) {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;

    > dd {
      text-align: right;
    }
  }
`;

const OfferedItem = styled(InfoRow)`
  position: relative;
  display: none;
`;

const ExchangeIcon = styled.span`
  display: none;

  @media (min-width: 901px) {
    position: absolute;
    z-index: 1;
    top: 50%;
    right: 0;
    display: block;
    color: #77737a;
    transform: translate(50%, -50%);
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
  position: relative;
  display: grid;
  margin-top: 32px;

  @media (max-width: 767px) {
    position: fixed;
    inset: auto 0 0;
    z-index: 35;
    margin: 0;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid #e9e9ec;
    background: white;

    a {
      min-height: 52px;
      background: #bf4355;
      border-color: #bf4355;
      color: #ffffff;
    }
  }
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

const OwnerMenu = styled.div`
  position: relative;
  margin-left: auto;

  @media (max-width: 767px) {
    position: absolute;
    z-index: 41;
    top: -46px;
    right: 8px;
  }
`;

const OwnerMenuButton = styled.button`
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: #202126;
  font-size: 24px;
  cursor: pointer;
`;

const OwnerMenuItems = styled.div`
  position: absolute;
  z-index: 2;
  top: 100%;
  right: 0;
  display: grid;
  min-width: 120px;
  padding: 4px;
  border: 1px solid #e9e9ec;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);

  a,
  button {
    display: flex;
    min-height: 44px;
    align-items: center;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #202126;
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      background: #f5f4f3;
    }
  }

  button {
    color: #d80f42;
  }
`;

const StatusButton = styled.button`
  min-height: 56px;
  border: 0;
  border-radius: 12px;
  background: #d73352;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
`;

const StatusChoices = styled.div`
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid #e9e9ec;
  border-radius: 12px;
  background: #fff;

  @media (min-width: 768px) {
    position: absolute;
    z-index: 2;
    top: calc(100% + 8px);
    inset-inline: 0;
    margin-bottom: 0;
  }

  @media (max-width: 767px) {
    grid-row: 1;
  }

  button {
    min-height: 44px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;

    &:disabled,
    &:hover {
      background: #f5f4f3;
    }
  }

  p {
    margin: 4px;
    color: #d80f42;
  }
`;

const DetailContent = styled.div`
  min-width: 0;
  grid-area: content;

  @media (max-width: 767px) {
    padding-inline: 24px;
  }
`;

const DescriptionSection = styled.section`
  margin-bottom: 40px;

  @media (max-width: 767px) {
    margin: 0 -24px 20px;
    padding: 20px 24px;
    border-block: 8px solid #f5f4f3;
  }
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
