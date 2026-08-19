import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import coinPriceIcon from '@/assets/coin_price_icon.svg';
import facilitiesIcon from '@/assets/facilities_icon.svg';
import gachaCapsuleIcon from '@/assets/gacha_capsule_icon.svg';
import gachaMachineCountIcon from '@/assets/gacha_machine_count_icon.svg';
import kujiIcon from '@/assets/kuji_icon.svg';
import paymentsIcon from '@/assets/payments_icon.svg';
import snsIcon from '@/assets/sns_icon.svg';

import * as S from './StoreDetailSheet.styles';
import { useBottomSheetDrag } from '../hooks/useBottomSheetDrag';
import type {
  BottomSheetState,
  StoreDetail,
  StoreDetailSocialLink,
} from '../model/storeDetail';

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

type GalleryKind = 'store' | 'gacha';

const GALLERY_CONFIG: Record<
  GalleryKind,
  { label: string; imageLabel: string; placeholder: string }
> = {
  store: {
    label: '매장 사진',
    imageLabel: '매장 사진',
    placeholder: '매장 사진 준비 중',
  },
  gacha: {
    label: '가챠 목록',
    imageLabel: '가챠 사진',
    placeholder: '가챠 사진 준비 중',
  },
};

interface GalleryThumbnailProps {
  imageUrl: string | null;
  imageLabel: string;
  index: number;
  placeholder: string;
  storeName: string;
}

function GalleryThumbnail({
  imageUrl,
  imageLabel,
  index,
  placeholder,
  storeName,
}: GalleryThumbnailProps) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!imageUrl || hasImageError) {
    return (
      <S.ThumbnailPlaceholder
        aria-label={`${storeName} ${imageLabel} ${index + 1} 준비 중`}
        role="img"
      >
        <S.ThumbnailPlaceholderMark aria-hidden="true" />
        <span>{placeholder}</span>
      </S.ThumbnailPlaceholder>
    );
  }

  return (
    <S.ThumbnailImage
      alt={`${storeName} ${imageLabel} ${index + 1}`}
      draggable={false}
      src={imageUrl}
      onError={() => setHasImageError(true)}
    />
  );
}

interface StoreGalleryProps {
  gachaImageUrls: string[];
  state: BottomSheetState;
  storeImageUrls: string[];
  storeName: string;
}

interface GalleryDragStart {
  activeIndex: number;
  pointerId: number;
  scrollLeft: number;
  x: number;
}

function getFrameScrollLeft(frame: HTMLElement, rail: HTMLElement) {
  const firstFrame = rail.children.item(0) as HTMLElement | null;

  return frame.offsetLeft - (firstFrame?.offsetLeft ?? 0);
}

function StoreGallery({
  gachaImageUrls,
  state,
  storeImageUrls,
  storeName,
}: StoreGalleryProps) {
  const tabPanelId = useId();
  const [galleryKind, setGalleryKind] = useState<GalleryKind>('store');
  const [showAll, setShowAll] = useState(false);
  const imageUrls = galleryKind === 'store' ? storeImageUrls : gachaImageUrls;
  const galleryConfig = GALLERY_CONFIG[galleryKind];
  const thumbnails = imageUrls.length > 0 ? imageUrls : FALLBACK_THUMBNAILS;
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<GalleryDragStart | null>(null);
  const dragDistanceRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canSlideLeft, setCanSlideLeft] = useState(false);
  const [canSlideRight, setCanSlideRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const updateSlideControls = useCallback(() => {
    const rail = railRef.current;

    if (!rail) return;

    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    const frames = Array.from(rail.children) as HTMLElement[];
    const nextActiveIndex = frames.reduce((closestIndex, frame, index) => {
      const closestFrame = frames[closestIndex];

      if (!closestFrame) return index;

      return Math.abs(getFrameScrollLeft(frame, rail) - rail.scrollLeft) <
        Math.abs(getFrameScrollLeft(closestFrame, rail) - rail.scrollLeft)
        ? index
        : closestIndex;
    }, 0);

    setActiveIndex(nextActiveIndex);
    setCanSlideLeft(rail.scrollLeft > 2);
    setCanSlideRight(rail.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;

    if (!rail) return;

    updateSlideControls();

    const resizeObserver = new ResizeObserver(updateSlideControls);

    resizeObserver.observe(rail);

    return () => resizeObserver.disconnect();
  }, [showAll, thumbnails.length, updateSlideControls]);

  useEffect(() => {
    setActiveIndex(0);
    setCanSlideLeft(false);
    setShowAll(false);
    railRef.current?.scrollTo({ left: 0 });
  }, [galleryKind]);

  useEffect(() => {
    if (state !== 'full') setShowAll(false);
  }, [state]);

  const slide = (direction: -1 | 1) => {
    const rail = railRef.current;

    if (!rail) return;

    const nextIndex = Math.min(
      Math.max(activeIndex + direction, 0),
      thumbnails.length - 1,
    );
    const nextFrame = rail.children.item(nextIndex) as HTMLElement | null;

    if (!nextFrame) return;

    rail.scrollTo({
      behavior: 'smooth',
      left: getFrameScrollLeft(nextFrame, rail),
    });
  };

  const handleGalleryPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragStartRef.current = {
      activeIndex,
      pointerId: event.pointerId,
      scrollLeft: event.currentTarget.scrollLeft,
      x: event.clientX,
    };
    dragDistanceRef.current = 0;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGalleryPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const dragStart = dragStartRef.current;

    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    const dragDistance = event.clientX - dragStart.x;

    dragDistanceRef.current = dragDistance;
    event.currentTarget.scrollLeft = dragStart.scrollLeft - dragDistance;

    if (Math.abs(dragDistance) > 4) event.preventDefault();
  };

  const finishGalleryDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;

    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    const direction =
      Math.abs(dragDistanceRef.current) < 36
        ? 0
        : dragDistanceRef.current > 0
          ? -1
          : 1;
    const nextIndex = Math.min(
      Math.max(dragStart.activeIndex + direction, 0),
      thumbnails.length - 1,
    );
    const nextFrame = event.currentTarget.children.item(
      nextIndex,
    ) as HTMLElement | null;

    if (nextFrame) {
      event.currentTarget.scrollTo({
        behavior: 'smooth',
        left: getFrameScrollLeft(nextFrame, event.currentTarget),
      });
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
    dragDistanceRef.current = 0;
    setIsDragging(false);
  };

  return (
    <S.PhotoSection $state={state}>
      <S.PhotoTitleRow>
        <S.GalleryTabs aria-label="사진 종류" role="tablist">
          {(Object.keys(GALLERY_CONFIG) as GalleryKind[]).map((kind) => (
            <S.GalleryTab
              key={kind}
              $isActive={galleryKind === kind}
              aria-controls={tabPanelId}
              aria-selected={galleryKind === kind}
              role="tab"
              type="button"
              onClick={() => setGalleryKind(kind)}
            >
              {GALLERY_CONFIG[kind].label}
            </S.GalleryTab>
          ))}
        </S.GalleryTabs>
        <S.GalleryControls
          aria-label={`${galleryConfig.label} 보기`}
          role="group"
        >
          {state === 'full' && (
            <S.GalleryViewButton
              disabled={imageUrls.length === 0}
              type="button"
              onClick={() => setShowAll((isShowingAll) => !isShowingAll)}
            >
              {showAll ? '미리보기' : '더보기'}
            </S.GalleryViewButton>
          )}
          {!showAll && (
            <>
              <S.GalleryControl
                aria-label={`이전 ${galleryConfig.imageLabel}`}
                disabled={!canSlideLeft}
                type="button"
                onClick={() => slide(-1)}
              >
                ‹
              </S.GalleryControl>
              <S.GalleryControl
                aria-label={`다음 ${galleryConfig.imageLabel}`}
                disabled={!canSlideRight}
                type="button"
                onClick={() => slide(1)}
              >
                ›
              </S.GalleryControl>
            </>
          )}
        </S.GalleryControls>
      </S.PhotoTitleRow>
      {showAll ? (
        <S.PhotoGrid
          id={tabPanelId}
          aria-label={`${galleryConfig.label} 전체 보기`}
          role="tabpanel"
        >
          {imageUrls.map((imageUrl, index) => (
            <S.GridImageFrame key={imageUrl}>
              <GalleryThumbnail
                imageLabel={galleryConfig.imageLabel}
                imageUrl={imageUrl}
                index={index}
                placeholder={galleryConfig.placeholder}
                storeName={storeName}
              />
            </S.GridImageFrame>
          ))}
        </S.PhotoGrid>
      ) : (
        <S.GalleryViewport
          id={tabPanelId}
          $state={state}
          aria-label={galleryConfig.label}
          role="tabpanel"
        >
          <S.ThumbnailRail
            ref={railRef}
            $isDragging={isDragging}
            aria-label={galleryConfig.label}
            data-horizontal-scroll
            onPointerCancel={finishGalleryDrag}
            onPointerDown={handleGalleryPointerDown}
            onPointerMove={handleGalleryPointerMove}
            onPointerUp={finishGalleryDrag}
            onScroll={updateSlideControls}
          >
            {thumbnails.map((imageUrl, index) => (
              <S.ThumbnailFrame
                key={`${galleryKind}-${imageUrl ?? `fallback-${index}`}`}
              >
                <GalleryThumbnail
                  imageLabel={galleryConfig.imageLabel}
                  imageUrl={imageUrl}
                  index={index}
                  placeholder={galleryConfig.placeholder}
                  storeName={storeName}
                />
              </S.ThumbnailFrame>
            ))}
          </S.ThumbnailRail>
        </S.GalleryViewport>
      )}
    </S.PhotoSection>
  );
}

interface InfoRowProps {
  icon?: string;
  label: string;
  children: ReactNode;
}

function InfoRow({ icon, label, children }: InfoRowProps) {
  return (
    <S.InfoRow>
      <S.InfoLabel>
        {icon && <S.InfoIcon alt="" src={icon} />}
        <span>{label}</span>
      </S.InfoLabel>
      <S.InfoValue>{children}</S.InfoValue>
    </S.InfoRow>
  );
}

interface ChipSectionProps {
  icon: string;
  title: string;
  chips: string[];
}

function ChipSection({ icon, title, chips }: ChipSectionProps) {
  if (chips.length === 0) return null;

  return (
    <S.Section>
      <S.IconSectionTitle>
        <S.SectionIcon alt="" src={icon} />
        <span>{title}</span>
      </S.IconSectionTitle>
      <S.ChipList aria-label={title}>
        {chips.map((chip) => (
          <S.Chip key={chip}>{chip}</S.Chip>
        ))}
      </S.ChipList>
    </S.Section>
  );
}

function InstagramIcon() {
  return (
    <S.InstagramIcon aria-hidden="true" viewBox="0 0 24 24">
      <rect height="15" rx="4" width="15" x="4.5" y="4.5" />
      <circle cx="12" cy="12" r="3.25" />
      <circle className="instagram-dot" cx="16.8" cy="7.3" r="1" />
    </S.InstagramIcon>
  );
}

function KakaoIcon() {
  return (
    <S.KakaoIcon aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 4.3c-4.8 0-8.7 3.05-8.7 6.82 0 2.42 1.62 4.54 4.06 5.75l-.82 3.02a.35.35 0 0 0 .53.38l3.6-2.39c.43.04.87.07 1.33.07 4.8 0 8.7-3.06 8.7-6.83S16.8 4.3 12 4.3Z" />
    </S.KakaoIcon>
  );
}

function SocialPlatformIcon({
  platform,
}: Pick<StoreDetailSocialLink, 'platform'>) {
  return platform === 'kakao' ? <KakaoIcon /> : <InstagramIcon />;
}

function getPriceIcon(label: string) {
  if (label.includes('코인')) return coinPriceIcon;
  if (label.includes('쿠지')) return kujiIcon;

  return gachaCapsuleIcon;
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
      <S.Content $state={state}>
        <S.Overview $state={state}>
          <S.OverviewHeading>
            <S.StoreName id={titleId}>{store.name}</S.StoreName>
            {store.distance && (
              <S.DistanceBadge>{store.distance}</S.DistanceBadge>
            )}
          </S.OverviewHeading>
          <S.StoreAddress>{store.address}</S.StoreAddress>
          <S.UpdatedAt $state={state}>
            마지막 업데이트 {store.updatedAt}
          </S.UpdatedAt>
        </S.Overview>

        <S.SummaryDetails $state={state}>
          <S.SummaryRow>
            <S.SummaryLabel>영업시간</S.SummaryLabel>
            <S.SummaryValue>{store.businessHours}</S.SummaryValue>
          </S.SummaryRow>
        </S.SummaryDetails>

        {store.categories.length > 0 && (
          <S.CategoryList $state={state} aria-label="매장 카테고리">
            {store.categories.map((category) => (
              <S.CategoryChip key={category}>{category}</S.CategoryChip>
            ))}
          </S.CategoryList>
        )}

        <StoreGallery
          gachaImageUrls={store.gachaImageUrls}
          state={state}
          storeImageUrls={store.imageUrls}
          storeName={store.name}
        />

        {state === 'full' && (
          <>
            {(store.phone || store.socialLinks.length > 0) && (
              <S.InfoList>
                {store.phone && (
                  <InfoRow label="전화번호">{store.phone}</InfoRow>
                )}
                {store.socialLinks.length > 0 && (
                  <InfoRow icon={snsIcon} label="SNS">
                    <S.SocialLinkList aria-label="매장 SNS 링크">
                      {store.socialLinks.map((socialLink) => (
                        <li key={`${socialLink.platform}-${socialLink.url}`}>
                          <S.SocialLink
                            $platform={socialLink.platform}
                            aria-label={`${socialLink.platform === 'kakao' ? '카카오톡' : '인스타그램'} 계정으로 이동`}
                            href={socialLink.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <SocialPlatformIcon
                              platform={socialLink.platform}
                            />
                          </S.SocialLink>
                        </li>
                      ))}
                    </S.SocialLinkList>
                  </InfoRow>
                )}
              </S.InfoList>
            )}

            <S.Section>
              <S.SectionTitle>기기 및 상품</S.SectionTitle>
              <S.AmountGrid>
                <S.AmountCard>
                  <S.AmountIcon alt="" src={gachaMachineCountIcon} />
                  <S.AmountText>
                    <S.AmountLabel>가챠 기계</S.AmountLabel>
                    <S.AmountValue>{store.machineAmount}</S.AmountValue>
                  </S.AmountText>
                </S.AmountCard>
                <S.AmountCard>
                  <S.AmountIcon alt="" src={kujiIcon} />
                  <S.AmountText>
                    <S.AmountLabel>쿠지</S.AmountLabel>
                    <S.AmountValue>{store.kujiAmount}</S.AmountValue>
                  </S.AmountText>
                </S.AmountCard>
              </S.AmountGrid>
            </S.Section>

            {store.prices.length > 0 && (
              <S.Section>
                <S.SectionTitle>가격 안내</S.SectionTitle>
                <S.PriceList>
                  {store.prices.map((price) => (
                    <S.PriceRow key={price.label}>
                      <S.PriceLabel>
                        <S.PriceIcon alt="" src={getPriceIcon(price.label)} />
                        <span>{price.label}</span>
                      </S.PriceLabel>
                      <S.PriceValue>{price.value}</S.PriceValue>
                    </S.PriceRow>
                  ))}
                </S.PriceList>
              </S.Section>
            )}

            <ChipSection
              chips={store.paymentMethods}
              icon={paymentsIcon}
              title="결제 방식"
            />
            <ChipSection
              chips={store.facilities}
              icon={facilitiesIcon}
              title="편의시설"
            />
          </>
        )}
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
