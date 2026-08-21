import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import coinPriceIcon from '@/assets/coin_price_icon.svg';
import facilitiesIcon from '@/assets/facilities_icon.svg';
import gachaCapsuleIcon from '@/assets/gacha_capsule_icon.svg';
import gachaMachineCountIcon from '@/assets/gacha_machine_count_icon.svg';
import kujiIcon from '@/assets/kuji_icon.svg';
import paymentsIcon from '@/assets/payments_icon.svg';
import snsIcon from '@/assets/sns_icon.svg';

import GachaCatalogInterest from './GachaCatalogInterest';
import PhotoViewer from './PhotoViewer';
import * as S from './StoreDetailSheet.styles';
import { useBottomSheetDrag } from '../hooks/useBottomSheetDrag';
import { useGachaCatalogPages } from '../hooks/useGachaCatalogPages';
import { useRailDrag } from '../hooks/useRailDrag';
import { isGachaCatalogInterestEligible } from '../model/isGachaCatalogInterestEligible';
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

/** 상단 레일에 미리 보여주는 장수. 나머지는 전체 보기에서 본다. */
const RAIL_PREVIEW_COUNT = 5;

/** 전체 보기가 데려갈 자리. 시트 안에서만 쓰는 id 라 고정값이면 충분하다. */
const GACHA_CATALOG_ID = 'gacha-catalog';

/* ---------------------------------------------------------- 대표 사진 */

/** 도형은 지도 마커(`markerIcon.ts`)와 같은 원·씰 좌표를 쓴다. */
function CapsuleMark() {
  return (
    <S.ThumbnailPlaceholderMark aria-hidden="true" viewBox="0 0 40 56">
      <circle className="capsule-body" cx="20" cy="28" r="17" />
      <g transform="rotate(-14 20 28)">
        <rect className="capsule-seam" x="0" y="26" width="40" height="4" />
      </g>
    </S.ThumbnailPlaceholderMark>
  );
}

interface StoreHeroProps {
  imageUrls: string[];
  storeName: string;
  onOpenPhoto: (imageUrls: string[], index: number) => void;
}

/**
 * 시트 맨 위 대표 사진.
 *
 * 사진이 없어도 자리를 비우지 않는다. 비우면 이름이 시작하는 높이가 225px 에서
 * 48px 로 내려앉아, 매장을 옮겨가며 볼 때 같은 화면이 다르게 보인다.
 */
function StoreHero({ imageUrls, storeName, onOpenPhoto }: StoreHeroProps) {
  const [brokenUrls, setBrokenUrls] = useState<string[]>([]);
  const usableUrls = imageUrls.filter((url) => !brokenUrls.includes(url));
  const { activeIndex, isDragging, railProps, railRef } = useRailDrag(
    usableUrls.length,
    { onTapItem: (index) => onOpenPhoto(usableUrls, index) },
  );

  if (usableUrls.length === 0) {
    return (
      <S.Hero>
        <S.ThumbnailPlaceholder
          aria-label={`${storeName} 매장 사진 준비 중`}
          role="img"
        >
          <CapsuleMark />
          <span>매장 사진 준비 중</span>
        </S.ThumbnailPlaceholder>
      </S.Hero>
    );
  }

  return (
    <S.Hero>
      <S.HeroRail
        ref={railRef}
        $isDragging={isDragging}
        aria-label={`${storeName} 매장 사진`}
        data-horizontal-scroll
        {...railProps}
      >
        {usableUrls.map((imageUrl, index) => (
          <S.HeroFrame key={imageUrl}>
            <S.HeroImage
              alt={`${storeName} 매장 사진 ${index + 1}`}
              draggable={false}
              src={imageUrl}
              onError={() =>
                setBrokenUrls((urls) =>
                  urls.includes(imageUrl) ? urls : [...urls, imageUrl],
                )
              }
            />
          </S.HeroFrame>
        ))}
      </S.HeroRail>
      <S.HeroShade aria-hidden="true" />
      {usableUrls.length > 1 && (
        <S.HeroCounter aria-hidden="true">
          {activeIndex + 1} / {usableUrls.length}
        </S.HeroCounter>
      )}
    </S.Hero>
  );
}

/* ---------------------------------------------------------- 가챠 사진 */

interface GachaThumbnailProps {
  imageUrl: string | null;
  index: number;
  storeName: string;
}

function GachaThumbnail({ imageUrl, index, storeName }: GachaThumbnailProps) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!imageUrl || hasImageError) {
    return (
      <S.ThumbnailPlaceholder
        aria-label={`${storeName} 가챠 사진 ${index + 1} 준비 중`}
        role="img"
      >
        <CapsuleMark />
        <span>가챠 사진 준비 중</span>
      </S.ThumbnailPlaceholder>
    );
  }

  return (
    <S.ThumbnailImage
      alt={`${storeName} 가챠 사진 ${index + 1}`}
      draggable={false}
      src={imageUrl}
      onError={() => setHasImageError(true)}
    />
  );
}

interface GachaGalleryProps {
  canRequestGachaCatalog: boolean;
  imageUrls: string[];
  storeId: number;
  storeName: string;
  /** 전체 보기를 누르면 맨 아래 전체 섹션으로 데려간다. 없으면 버튼을 안 그린다. */
  onShowAll: (() => void) | null;
  onOpenPhoto: (imageUrls: string[], index: number) => void;
}

/**
 * 가챠 사진만 다룬다.
 *
 * 전에는 매장 사진과 탭 하나에 묶여 한 번에 하나만 보였다. 매장 사진이
 * 맨 위 대표 사진으로 나가면서 탭이 필요 없어졌다.
 */
function GachaGallery({
  canRequestGachaCatalog,
  imageUrls,
  storeId,
  storeName,
  onShowAll,
  onOpenPhoto,
}: GachaGalleryProps) {
  const titleId = useId();
  const thumbnails =
    imageUrls.length > 0
      ? imageUrls.slice(0, RAIL_PREVIEW_COUNT)
      : FALLBACK_THUMBNAILS;
  const { isDragging, railProps, railRef } = useRailDrag(thumbnails.length, {
    onTapItem: (index) => {
      if (imageUrls.length > 0) onOpenPhoto(imageUrls, index);
    },
  });

  return (
    <S.GachaSection aria-labelledby={titleId}>
      <S.SectionTitle id={titleId}>가챠 사진</S.SectionTitle>

      {canRequestGachaCatalog ? (
        <GachaCatalogInterest
          key={storeId}
          storeId={storeId}
          storeName={storeName}
        />
      ) : (
        <S.GalleryViewport>
          <S.ThumbnailRail
            ref={railRef}
            $isDragging={isDragging}
            aria-label="가챠 사진"
            data-horizontal-scroll
            {...railProps}
          >
            {thumbnails.map((imageUrl, index) => (
              <S.ThumbnailFrame key={imageUrl ?? `fallback-${index}`}>
                <GachaThumbnail
                  imageUrl={imageUrl}
                  index={index}
                  storeName={storeName}
                />
              </S.ThumbnailFrame>
            ))}
            {onShowAll && (
              <S.ShowAllSlot data-rail-control>
                <S.ShowAllButton
                  aria-label="가챠 사진 전체보기"
                  type="button"
                  onClick={onShowAll}
                >
                  <svg aria-hidden="true" viewBox="0 0 16 16">
                    <path d="M6 3.5 10.5 8 6 12.5" />
                  </svg>
                </S.ShowAllButton>
                <S.ShowAllLabel aria-hidden="true">전체보기</S.ShowAllLabel>
              </S.ShowAllSlot>
            )}
          </S.ThumbnailRail>
        </S.GalleryViewport>
      )}
    </S.GachaSection>
  );
}

interface GachaCatalogProps {
  firstPageImageUrls: string[];
  storeId: number;
  storeName: string;
  totalPages: number;
  onOpenPhoto: (imageUrls: string[], index: number) => void;
}

/**
 * 시트 맨 아래에 붙는 가챠 사진 전체.
 *
 * 스크롤이 끝에 닿을 때마다 다음 페이지를 이어 붙인다. 한 번에 다 그리면
 * 사진 수만큼 DOM 이 생겨서 스크롤이 무거워진다.
 */
function GachaCatalog({
  firstPageImageUrls,
  storeId,
  storeName,
  totalPages,
  onOpenPhoto,
}: GachaCatalogProps) {
  const titleId = useId();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { hasFailed, hasMore, imageUrls, isLoading, loadMore } =
    useGachaCatalogPages({ firstPageImageUrls, storeId, totalPages });

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore || hasFailed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      // 바닥에 닿기 전에 미리 부른다. 기다리는 시간이 줄어든다.
      { rootMargin: '320px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasFailed, hasMore, loadMore]);

  return (
    <S.GachaCatalogSection
      aria-labelledby={titleId}
      id={GACHA_CATALOG_ID}
      tabIndex={-1}
    >
      <S.SectionTitle id={titleId}>가챠 사진 전체</S.SectionTitle>
      <S.PhotoGrid>
        {imageUrls.map((imageUrl, index) => (
          <S.GridImageFrame
            key={imageUrl}
            aria-label={`${storeName} 가챠 사진 ${index + 1} 크게 보기`}
            type="button"
            onClick={() => onOpenPhoto(imageUrls, index)}
          >
            <GachaThumbnail
              imageUrl={imageUrl}
              index={index}
              storeName={storeName}
            />
          </S.GridImageFrame>
        ))}
      </S.PhotoGrid>

      <S.CatalogSentinel ref={sentinelRef} aria-hidden="true" />

      {isLoading && (
        <S.CatalogStatus role="status">사진을 더 불러오는 중</S.CatalogStatus>
      )}
      {hasFailed && (
        <S.CatalogStatus role="alert">
          더 불러오지 못했어요.{' '}
          <S.GalleryViewButton type="button" onClick={loadMore}>
            다시 시도
          </S.GalleryViewButton>
        </S.CatalogStatus>
      )}
    </S.GachaCatalogSection>
  );
}

/* ------------------------------------------------------------ 작은 조각 */

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
  isOnImage: boolean;
  onClose: () => void;
}

function SheetHeader({ handleProps, isOnImage, onClose }: SheetHeaderProps) {
  return (
    <S.SheetTopBar>
      <S.DragHandleButton type="button" {...handleProps}>
        <S.Grabber $onImage={isOnImage} aria-hidden="true" />
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

/**
 * 접힌 단계에 보이는 한 줄 요약. 거리와 영업시간, 카테고리를 이어 붙인다.
 * 영업시간은 여러 줄일 수 있어 첫 줄만 쓴다.
 */
function getCompactMeta(store: StoreDetail) {
  const [firstBusinessHoursLine] = store.businessHours.split('\n');

  return [store.distance, firstBusinessHoursLine, ...store.categories]
    .filter(Boolean)
    .join(' · ');
}

interface CompactStoreSummaryProps {
  store: StoreDetail;
  titleId: string;
}

function CompactStoreSummary({ store, titleId }: CompactStoreSummaryProps) {
  return (
    <S.CompactContent>
      <S.CompactStoreName id={titleId}>{store.name}</S.CompactStoreName>
      <S.CompactMeta>{getCompactMeta(store)}</S.CompactMeta>
    </S.CompactContent>
  );
}

/* ---------------------------------------------------------- 시트 본문 */

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
  // 첫 페이지 밖에 사진이 더 있을 때만 전체 보기로 데려갈 곳이 생긴다.
  const hasFullCatalog =
    state === 'full' &&
    (store.gachaImageUrls.length > RAIL_PREVIEW_COUNT ||
      store.gachaTotalPages > 1);

  useEffect(() => {
    if (state !== 'full' && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [state]);

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [photoView, setPhotoView] = useState<{
    imageUrls: string[];
    startIndex: number;
  } | null>(null);

  const openPhoto = (imageUrls: string[], startIndex: number) =>
    setPhotoView({ imageUrls, startIndex });

  const closePhoto = useCallback(() => setPhotoView(null), []);

  useEffect(() => {
    const sentinel = topSentinelRef.current;

    if (!sentinel) return;

    // 스크롤 핸들러 대신 센티넬을 본다. 매 프레임 상태를 건드리지 않는다.
    const observer = new IntersectionObserver(([entry]) =>
      setIsScrolledDown(!entry?.isIntersecting),
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  const scrollTo = (top: number) =>
    scrollAreaRef.current?.scrollTo({ behavior: 'smooth', top });

  const showCatalog = () => {
    const catalog = document.getElementById(GACHA_CATALOG_ID);
    const scrollArea = scrollAreaRef.current;

    if (!catalog || !scrollArea) return;

    scrollTo(
      scrollArea.scrollTop +
        catalog.getBoundingClientRect().top -
        scrollArea.getBoundingClientRect().top,
    );
    // 스크롤만 하면 키보드 사용자는 어디로 갔는지 알 수 없다.
    catalog.focus({ preventScroll: true });
  };

  return (
    <>
      <S.ScrollArea
        ref={scrollAreaRef}
        $canScroll={state === 'full'}
        data-sheet-scroll
      >
        <S.TopSentinel ref={topSentinelRef} aria-hidden="true" />

        <StoreHero
          imageUrls={store.imageUrls}
          storeName={store.name}
          onOpenPhoto={openPhoto}
        />

        <S.Content>
          <S.Overview>
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

          <S.SummaryDetails>
            <S.SummaryRow>
              <S.SummaryLabel>영업시간</S.SummaryLabel>
              <S.SummaryValue>{store.businessHours}</S.SummaryValue>
            </S.SummaryRow>
          </S.SummaryDetails>

          {store.categories.length > 0 && (
            <S.CategoryList aria-label="매장 카테고리">
              {store.categories.map((category) => (
                <S.CategoryChip key={category}>{category}</S.CategoryChip>
              ))}
            </S.CategoryList>
          )}

          <GachaGallery
            canRequestGachaCatalog={isGachaCatalogInterestEligible(store)}
            imageUrls={store.gachaImageUrls}
            storeId={store.id}
            storeName={store.name}
            onOpenPhoto={openPhoto}
            onShowAll={hasFullCatalog ? showCatalog : null}
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

              {hasFullCatalog && (
                <GachaCatalog
                  key={store.id}
                  firstPageImageUrls={store.gachaImageUrls}
                  storeId={store.id}
                  storeName={store.name}
                  totalPages={store.gachaTotalPages}
                  onOpenPhoto={openPhoto}
                />
              )}
            </>
          )}
        </S.Content>
      </S.ScrollArea>

      {photoView && (
        <PhotoViewer
          imageUrls={photoView.imageUrls}
          startIndex={photoView.startIndex}
          title={`${store.name} 사진`}
          onClose={closePhoto}
        />
      )}

      {isScrolledDown && (
        <S.ScrollTopButton
          aria-label="맨 위로"
          type="button"
          onClick={() => scrollTo(0)}
        >
          <S.ScrollTopIcon aria-hidden="true" viewBox="0 0 16 16">
            <path
              d="M8 4.6 13.4 11.4H2.6Z"
              strokeLinejoin="round"
              strokeWidth="1.6"
              stroke="currentcolor"
            />
          </S.ScrollTopIcon>
        </S.ScrollTopButton>
      )}
    </>
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
  const isCollapsed = props.state === 'collapsed';

  // 접힌 단계는 시트가 116px 만 보인다. 사진을 그리면 이름이 밀려 사라진다.
  const isHandleOnImage =
    props.status === 'success' &&
    !isCollapsed &&
    props.store.imageUrls.length > 0;

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
      <SheetHeader
        handleProps={handleProps}
        isOnImage={isHandleOnImage}
        onClose={props.onClose}
      />

      {props.status === 'loading' && <LoadingContent />}
      {props.status === 'error' && (
        <ErrorContent titleId={titleId} onRetry={props.onRetry} />
      )}
      {props.status === 'success' &&
        (isCollapsed ? (
          <CompactStoreSummary store={props.store} titleId={titleId} />
        ) : (
          <StoreDetailContent
            state={props.state}
            store={props.store}
            titleId={titleId}
          />
        ))}
    </S.SheetRoot>
  );
}
