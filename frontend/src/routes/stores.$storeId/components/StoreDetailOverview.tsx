import { useState, type ReactNode } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import { StoreAmenities } from './StoreAmenities';
import {
  Address,
  EmptyGalleryLabel,
  Gallery,
  GalleryFrame,
  GalleryImage,
  GalleryOpenButton,
  Heading,
  HeadingCopy,
  PhotoCountBadge,
  Title,
} from './StoreDetailOverview.styles';
import { StorePhotoViewer } from './StorePhotoViewer';
import { StoreQuickFacts } from './StoreQuickFacts';

export interface StoreDetailOverviewProps {
  store: StoreDetailResponseDto;
}

const MAX_GALLERY_PREVIEW_COUNT = 5;

function createImageUrls(store: StoreDetailResponseDto): readonly string[] {
  const imageUrls = [
    store.thumbnailUrl,
    ...store.images.map(({ imageUrl }) => imageUrl),
  ].filter((imageUrl): imageUrl is string => Boolean(imageUrl?.trim()));

  return Array.from(new Set(imageUrls));
}

function ImageFrame({
  children,
  isMain = false,
  label,
  photoCount,
  onOpen,
}: {
  children: ReactNode;
  isMain?: boolean;
  label: string;
  photoCount: number | null;
  onOpen: () => void;
}) {
  return (
    <GalleryFrame $isMain={isMain}>
      {children}
      <GalleryOpenButton type="button" aria-label={label} onClick={onOpen}>
        {photoCount !== null && (
          <PhotoCountBadge>전체 {photoCount}장 보기</PhotoCountBadge>
        )}
      </GalleryOpenButton>
    </GalleryFrame>
  );
}

export function StoreDetailOverview({ store }: StoreDetailOverviewProps) {
  const imageUrls = createImageUrls(store);
  const previewImageUrls = imageUrls.slice(0, MAX_GALLERY_PREVIEW_COUNT);
  const hasGalleryImage = imageUrls.length > 0;
  const [viewerStartIndex, setViewerStartIndex] = useState<number | null>(null);

  return (
    <>
      <Heading>
        <HeadingCopy>
          <Title>{store.name}</Title>
          <Address>{store.address}</Address>
        </HeadingCopy>
      </Heading>

      <Gallery $isSingle={imageUrls.length <= 1} aria-label="매장 사진">
        {hasGalleryImage ? (
          previewImageUrls.map((imageUrl, index) => (
            <ImageFrame
              key={imageUrl}
              isMain={index === 0}
              label={`${index + 1}번째 매장 사진 크게 보기`}
              photoCount={
                index === previewImageUrls.length - 1 &&
                imageUrls.length > MAX_GALLERY_PREVIEW_COUNT
                  ? imageUrls.length
                  : null
              }
              onOpen={() => setViewerStartIndex(index)}
            >
              <LogoImagePlaceholder />
              <GalleryImage
                src={imageUrl}
                alt={`${store.name} 매장 사진 ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </ImageFrame>
          ))
        ) : (
          <GalleryFrame $isMain>
            <LogoImagePlaceholder />
            <EmptyGalleryLabel>매장 사진을 준비하고 있어요</EmptyGalleryLabel>
          </GalleryFrame>
        )}
      </Gallery>

      <StoreQuickFacts store={store} />
      <StoreAmenities store={store} />

      {viewerStartIndex !== null && (
        <StorePhotoViewer
          imageUrls={imageUrls}
          initialIndex={viewerStartIndex}
          storeName={store.name}
          onClose={() => setViewerStartIndex(null)}
        />
      )}
    </>
  );
}
