import styled from '@emotion/styled';

import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

export interface CardProps {
  product: GachaProductSummary;
  categoryName?: string;
  resultPosition?: number;
}

export default function Card({
  product,
  categoryName = product.categories[0] ?? '미분류',
  resultPosition = 0,
}: CardProps) {
  return (
    <Wrapper
      href={createGachaSearchResultsUrl(product.gachaId)}
      onClick={() =>
        captureAnalyticsEvent('category_gacha_selected', {
          category_name: categoryName,
          gacha_id: product.gachaId,
          result_position: resultPosition,
        })
      }
    >
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

const Wrapper = styled.a`
  width: 100%;
  max-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;

  &:focus-visible {
    outline: 3px solid #d93652;
    outline-offset: 4px;
  }
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
