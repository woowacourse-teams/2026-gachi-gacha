import styled from '@emotion/styled';

import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

export interface CardProps {
  product: GachaProductSummary;
}

export default function Card({ product }: CardProps) {
  return (
    <Wrapper>
      <Thumbnail>
        <ImagePlaceholder aria-hidden="true">
          <LogoImagePlaceholder />
        </ImagePlaceholder>
        <ThumbnailImage src={product.thumbnailUrl} alt="" loading="lazy" />
      </Thumbnail>
      <Name>{product.name}</Name>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Thumbnail = styled.div`
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  place-items: center;
  border-radius: 12px;
  background: #faf7f8;
`;

const ThumbnailImage = styled(ImageWithFallback)`
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.span`
  position: absolute;
  display: grid;
  inset: 0;
  place-items: center;

  img {
    width: 28%;
  }
`;

const Name = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #2b2528;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
