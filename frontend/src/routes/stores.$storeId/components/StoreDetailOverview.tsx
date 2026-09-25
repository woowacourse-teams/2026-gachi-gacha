import type { ReactNode } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import {
  Address,
  EmptyGalleryLabel,
  Eyebrow,
  Gallery,
  GalleryFrame,
  GalleryImage,
  Heading,
  HeadingCopy,
  Title,
} from './StoreDetailOverview.styles';

export interface StoreDetailOverviewProps {
  store: StoreDetailResponseDto;
}

const MAX_GALLERY_IMAGE_COUNT = 5;

function createImageUrls(store: StoreDetailResponseDto): readonly string[] {
  const imageUrls = [
    store.thumbnailUrl,
    ...store.images.map(({ imageUrl }) => imageUrl),
  ].filter((imageUrl): imageUrl is string => Boolean(imageUrl?.trim()));

  return Array.from(new Set(imageUrls)).slice(0, MAX_GALLERY_IMAGE_COUNT);
}

function ImageFrame({
  children,
  isMain = false,
}: {
  children: ReactNode;
  isMain?: boolean;
}) {
  return <GalleryFrame $isMain={isMain}>{children}</GalleryFrame>;
}

export function StoreDetailOverview({ store }: StoreDetailOverviewProps) {
  const imageUrls = createImageUrls(store);
  const hasGalleryImage = imageUrls.length > 0;

  return (
    <>
      <Heading>
        <HeadingCopy>
          <Eyebrow>매장 상세</Eyebrow>
          <Title>{store.name}</Title>
          <Address>{store.address}</Address>
        </HeadingCopy>
      </Heading>

      <Gallery $isSingle={imageUrls.length <= 1} aria-label="매장 사진">
        {hasGalleryImage ? (
          imageUrls.map((imageUrl, index) => (
            <ImageFrame key={imageUrl} isMain={index === 0}>
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
          <ImageFrame isMain>
            <LogoImagePlaceholder />
            <EmptyGalleryLabel>매장 사진을 준비하고 있어요</EmptyGalleryLabel>
          </ImageFrame>
        )}
      </Gallery>
    </>
  );
}
