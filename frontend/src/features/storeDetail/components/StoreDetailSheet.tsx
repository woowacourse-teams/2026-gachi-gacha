import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import * as S from './StoreDetailSheet.styles';
import { useBottomSheetDrag } from '../hooks/useBottomSheetDrag';
import type { BottomSheetState, StoreDetail } from '../model/storeDetail';

interface StoreDetailSheetBaseProps {
  state: BottomSheetState;
  onClose: () => void;
  onStateChange: (state: BottomSheetState) => void;
}

interface StoreDetailSheetSuccessProps extends StoreDetailSheetBaseProps {
  status: 'success';
  store: StoreDetail;
}

interface StoreDetailSheetLoadingProps extends StoreDetailSheetBaseProps {
  status: 'loading';
}

interface StoreDetailSheetErrorProps extends StoreDetailSheetBaseProps {
  status: 'error';
  onRetry: () => void;
}

export type StoreDetailSheetProps =
  | StoreDetailSheetSuccessProps
  | StoreDetailSheetLoadingProps
  | StoreDetailSheetErrorProps;

const FALLBACK_THUMBNAILS = [null, null, null] as const;

interface StoreThumbnailProps {
  imageUrl: string | null;
  index: number;
  storeName: string;
}

function StoreThumbnail({ imageUrl, index, storeName }: StoreThumbnailProps) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!imageUrl || hasImageError) {
    return (
      <S.ThumbnailPlaceholder
        aria-label={`${storeName} 매장 사진 ${index + 1} 준비 중`}
        role="img"
      >
        <S.ThumbnailPlaceholderMark aria-hidden="true" />
        <span>매장 사진 준비 중</span>
      </S.ThumbnailPlaceholder>
    );
  }

  return (
    <S.ThumbnailImage
      alt={`${storeName} 매장 사진 ${index + 1}`}
      src={imageUrl}
      onError={() => setHasImageError(true)}
    />
  );
}

interface StoreGalleryProps {
  imageUrls: string[];
  storeName: string;
}

function StoreGallery({ imageUrls, storeName }: StoreGalleryProps) {
  const thumbnails = imageUrls.length > 0 ? imageUrls : FALLBACK_THUMBNAILS;

  return (
    <S.PhotoSection>
      <S.SectionTitle>매장 사진</S.SectionTitle>
      <S.ThumbnailRail aria-label="매장 사진 목록">
        {thumbnails.map((imageUrl, index) => (
          <S.ThumbnailFrame key={imageUrl ?? `fallback-${index}`}>
            <StoreThumbnail
              imageUrl={imageUrl}
              index={index}
              storeName={storeName}
            />
          </S.ThumbnailFrame>
        ))}
      </S.ThumbnailRail>
    </S.PhotoSection>
  );
}

interface InfoRowProps {
  label: string;
  children: ReactNode;
}

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <S.InfoRow>
      <S.InfoLabel>{label}</S.InfoLabel>
      <S.InfoValue>{children}</S.InfoValue>
    </S.InfoRow>
  );
}

interface ChipSectionProps {
  title: string;
  chips: string[];
}

function ChipSection({ title, chips }: ChipSectionProps) {
  if (chips.length === 0) return null;

  return (
    <S.Section>
      <S.SectionTitle>{title}</S.SectionTitle>
      <S.ChipList aria-label={title}>
        {chips.map((chip) => (
          <S.Chip key={chip}>{chip}</S.Chip>
        ))}
      </S.ChipList>
    </S.Section>
  );
}

interface SheetHeaderProps {
  handleProps: ReturnType<typeof useBottomSheetDrag>['handleProps'];
  onClose: () => void;
}

function SheetHeader({ handleProps, onClose }: SheetHeaderProps) {
  return (
    <S.SheetTopBar>
      <S.DragHandleButton type="button" {...handleProps}>
        <S.Grabber aria-hidden="true" />
      </S.DragHandleButton>
      <S.CloseButton
        aria-label="매장 상세 닫기"
        type="button"
        onClick={onClose}
      >
        ×
      </S.CloseButton>
    </S.SheetTopBar>
  );
}

interface StoreDetailContentProps {
  state: BottomSheetState;
  store: StoreDetail;
  titleId: string;
}

function StoreDetailContent({
  state,
  store,
  titleId,
}: StoreDetailContentProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== 'full' && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [state]);

  return (
    <S.ScrollArea
      ref={scrollAreaRef}
      $canScroll={state === 'full'}
      data-sheet-scroll
    >
      <S.Content>
        <S.Overview>
          <S.OverviewHeading>
            <S.StoreName id={titleId}>{store.name}</S.StoreName>
            {store.distance && (
              <S.DistanceBadge>{store.distance}</S.DistanceBadge>
            )}
          </S.OverviewHeading>
          <S.StoreAddress>{store.address}</S.StoreAddress>
          <S.UpdatedAt>마지막 업데이트 {store.updatedAt}</S.UpdatedAt>
        </S.Overview>

        <S.SummaryDetails>
          <S.SummaryRow>
            <S.SummaryLabel>영업시간</S.SummaryLabel>
            <S.SummaryValue>{store.businessHours}</S.SummaryValue>
          </S.SummaryRow>
        </S.SummaryDetails>

        <S.SummaryAmounts>
          <S.SummaryAmount>
            가챠 기계
            <strong>{store.machineAmount}</strong>
          </S.SummaryAmount>
          <S.SummaryAmount>
            쿠지
            <strong>{store.kujiAmount}</strong>
          </S.SummaryAmount>
        </S.SummaryAmounts>

        <StoreGallery imageUrls={store.imageUrls} storeName={store.name} />

        {(store.phone || (store.instagramLabel && store.instagramUrl)) && (
          <S.InfoList>
            {store.phone && <InfoRow label="전화번호">{store.phone}</InfoRow>}
            {store.instagramLabel && store.instagramUrl && (
              <InfoRow label="인스타그램">
                <S.InstagramLink
                  href={store.instagramUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {store.instagramLabel}
                </S.InstagramLink>
              </InfoRow>
            )}
          </S.InfoList>
        )}

        <S.Section>
          <S.SectionTitle>기기 및 상품</S.SectionTitle>
          <S.AmountGrid>
            <S.AmountCard>
              <S.AmountLabel>가챠 기계</S.AmountLabel>
              <S.AmountValue>{store.machineAmount}</S.AmountValue>
            </S.AmountCard>
            <S.AmountCard>
              <S.AmountLabel>쿠지</S.AmountLabel>
              <S.AmountValue>{store.kujiAmount}</S.AmountValue>
            </S.AmountCard>
          </S.AmountGrid>
          <S.AvailabilityList>
            <S.Availability available={store.hasRandomBox}>
              랜덤박스 {store.hasRandomBox ? '있음' : '없음'}
            </S.Availability>
            <S.Availability available={store.hasSelectGacha}>
              선택 가챠 {store.hasSelectGacha ? '있음' : '없음'}
            </S.Availability>
          </S.AvailabilityList>
        </S.Section>

        {store.prices.length > 0 && (
          <S.Section>
            <S.SectionTitle>가격 안내</S.SectionTitle>
            <S.PriceList>
              {store.prices.map((price) => (
                <S.PriceRow key={price.label}>
                  <S.PriceLabel>{price.label}</S.PriceLabel>
                  <S.PriceValue>{price.value}</S.PriceValue>
                </S.PriceRow>
              ))}
            </S.PriceList>
          </S.Section>
        )}

        <ChipSection chips={store.paymentMethods} title="결제 방식" />
        <ChipSection chips={store.facilities} title="편의시설" />
      </S.Content>
    </S.ScrollArea>
  );
}

function LoadingContent() {
  return (
    <S.LoadingContent>
      <S.VisuallyHidden>매장 상세 정보를 불러오는 중입니다.</S.VisuallyHidden>
      <S.Skeleton width="68%" height={30} />
      <S.Skeleton width="88%" height={16} />
      <S.Skeleton width="42%" height={14} />
      <S.Skeleton height={1} />
      <S.Skeleton width="74%" height={18} />
      <S.Skeleton height={110} />
      <S.Skeleton height={160} />
    </S.LoadingContent>
  );
}

interface ErrorContentProps {
  titleId: string;
  onRetry: () => void;
}

function ErrorContent({ titleId, onRetry }: ErrorContentProps) {
  return (
    <S.ErrorBody role="alert">
      <S.ErrorMark aria-hidden="true">!</S.ErrorMark>
      <S.ErrorTitle id={titleId}>매장 정보를 불러오지 못했어요</S.ErrorTitle>
      <S.ErrorDescription>
        네트워크 상태를 확인한 뒤 다시 시도해 주세요.
      </S.ErrorDescription>
      <S.RetryButton type="button" onClick={onRetry}>
        다시 시도
      </S.RetryButton>
    </S.ErrorBody>
  );
}

export default function StoreDetailSheet(props: StoreDetailSheetProps) {
  const titleId = useId();
  const { dragOffset, handleProps, isDragging, sheetProps } =
    useBottomSheetDrag({
      state: props.state,
      onStateChange: props.onStateChange,
    });
  const isClosed = props.state === 'closed';

  return (
    <S.SheetRoot
      $dragOffset={dragOffset}
      $isDragging={isDragging}
      $state={props.state}
      aria-busy={props.status === 'loading'}
      aria-hidden={isClosed}
      aria-label={props.status === 'loading' ? '매장 상세 정보' : undefined}
      aria-labelledby={props.status === 'loading' ? undefined : titleId}
      aria-modal="true"
      role="dialog"
      {...sheetProps}
    >
      <SheetHeader handleProps={handleProps} onClose={props.onClose} />

      {props.status === 'loading' && <LoadingContent />}
      {props.status === 'error' && (
        <ErrorContent titleId={titleId} onRetry={props.onRetry} />
      )}
      {props.status === 'success' && (
        <StoreDetailContent
          state={props.state}
          store={props.store}
          titleId={titleId}
        />
      )}
    </S.SheetRoot>
  );
}
