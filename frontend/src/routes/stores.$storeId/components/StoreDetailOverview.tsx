import { useCallback, useRef, useState } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import {
  Address,
  EmptyGalleryLabel,
  Gallery,
  GalleryFrame,
  GalleryImage,
  GalleryOpenButton,
  GalleryTrack,
  GalleryNavigation,
  Heading,
  HeadingCopy,
  Overview,
  PhotoCountBadge,
  Title,
} from './StoreDetailOverview.styles';
import { StoreGachaCatalog } from './StoreGachaCatalog';
import { StorePhotoViewer } from './StorePhotoViewer';
import { StorePriceGuide } from './StorePriceGuide';
import { StoreVisitInfo, StoreUpdatedAt } from './StoreVisitInfo';

export interface StoreDetailOverviewProps {
  store: StoreDetailResponseDto;
}

function createImageUrls(store: StoreDetailResponseDto): readonly string[] {
  return Array.from(
    new Set(
      [
        store.thumbnailUrl,
        ...store.images.map(({ imageUrl }) => imageUrl),
      ].filter((url): url is string => Boolean(url?.trim())),
    ),
  );
}

export function StoreDetailOverview({ store }: StoreDetailOverviewProps) {
  const [failedImageUrls, setFailedImageUrls] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const imageUrls = createImageUrls(store).filter(
    (url) => !failedImageUrls.has(url),
  );
  const [viewerStartIndex, setViewerStartIndex] = useState<number | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const activeIndex = Math.max(0, imageUrls.indexOf(activeUrl ?? ''));
  const trackRef = useRef<HTMLDivElement>(null);
  const handleImageError = useCallback((url: string) => {
    setFailedImageUrls((current) => new Set(current).add(url));
    setActiveUrl(null);
    trackRef.current?.scrollTo?.({ left: 0, behavior: 'instant' });
  }, []);

  function showPhoto(index: number) {
    const url = imageUrls[index];
    if (!url) return;
    setActiveUrl(url);
    const track = trackRef.current;
    track?.scrollTo?.({
      left: index * track.clientWidth,
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }

  return (
    <Overview>
      <Gallery aria-label="매장 사진" aria-roledescription="캐러셀">
        <GalleryTrack
          ref={trackRef}
          tabIndex={imageUrls.length > 1 ? 0 : undefined}
          aria-label={
            imageUrls.length > 1 ? '좌우 방향키로 매장 사진 넘기기' : undefined
          }
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              event.preventDefault();
              showPhoto(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
            }
          }}
          onScroll={(event) => {
            const track = event.currentTarget;
            if (track.clientWidth > 0) {
              const index = Math.max(
                0,
                Math.min(
                  imageUrls.length - 1,
                  Math.round(track.scrollLeft / track.clientWidth),
                ),
              );
              setActiveUrl(imageUrls[index] ?? null);
            }
          }}
        >
          {imageUrls.length ? (
            imageUrls.map((url, index) => (
              <GalleryFrame key={url}>
                <LogoImagePlaceholder />
                <GalleryImage
                  src={url}
                  alt={`${store.name} 매장 사진 ${index + 1}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={() => handleImageError(url)}
                />
                <GalleryOpenButton
                  type="button"
                  aria-label={`${index + 1}번째 매장 사진 크게 보기`}
                  onClick={() => {
                    captureAnalyticsEvent('store_photo_viewed', {
                      store_id: store.storeId,
                      photo_index: index,
                      photo_count: imageUrls.length,
                      source: 'gallery',
                    });
                    setViewerStartIndex(index);
                  }}
                />
              </GalleryFrame>
            ))
          ) : (
            <GalleryFrame>
              <LogoImagePlaceholder />
              <EmptyGalleryLabel>매장 사진을 준비하고 있어요</EmptyGalleryLabel>
            </GalleryFrame>
          )}
        </GalleryTrack>
        {imageUrls.length > 1 && (
          <>
            <GalleryNavigation aria-label="매장 사진 넘기기">
              <button
                type="button"
                aria-label="이전 매장 사진"
                disabled={activeIndex === 0}
                onClick={() => showPhoto(activeIndex - 1)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m15 5-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="다음 매장 사진"
                disabled={activeIndex === imageUrls.length - 1}
                onClick={() => showPhoto(activeIndex + 1)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </button>
            </GalleryNavigation>
            <PhotoCountBadge role="status" aria-label="현재 매장 사진">
              {activeIndex + 1} / {imageUrls.length}
            </PhotoCountBadge>
          </>
        )}
      </Gallery>
      <Heading>
        <HeadingCopy>
          <Title>{store.name}</Title>
          <Address>{store.address}</Address>
        </HeadingCopy>
      </Heading>
      <StoreVisitInfo store={store} />
      <StorePriceGuide store={store} />
      <StoreGachaCatalog storeId={store.storeId} />
      <StoreUpdatedAt updatedAt={store.updatedAt} />
      {viewerStartIndex !== null && imageUrls.length > 0 && (
        <StorePhotoViewer
          imageUrls={imageUrls}
          initialIndex={Math.min(viewerStartIndex, imageUrls.length - 1)}
          storeId={store.storeId}
          storeName={store.name}
          onClose={() => setViewerStartIndex(null)}
          onImageError={handleImageError}
        />
      )}
    </Overview>
  );
}
