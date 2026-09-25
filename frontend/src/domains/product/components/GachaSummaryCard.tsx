import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import type { GachaProductSummary } from '../gachaProductType';
import {
  CategoryText,
  Card,
  GachaImage,
  GachaImageFallback,
  GachaImageFrame,
  GachaName,
} from './GachaSummaryCard.styles';

export interface GachaSummaryCardProps {
  product: GachaProductSummary;
  categoryLabel?: string;
  imageAlt?: string;
}

const MAX_DEFAULT_CATEGORY_COUNT = 2;

function createDefaultCategoryLabel(categories: readonly string[]): string {
  if (categories.length === 0) {
    return '카테고리 미등록';
  }

  const visibleCategories = categories.slice(0, MAX_DEFAULT_CATEGORY_COUNT);
  const hiddenCategoryCount = categories.length - visibleCategories.length;
  const visibleLabel = visibleCategories.join(' · ');

  return hiddenCategoryCount > 0
    ? `${visibleLabel} 외 ${hiddenCategoryCount}개`
    : visibleLabel;
}

export function GachaSummaryCard({
  product,
  categoryLabel,
  imageAlt = '',
}: GachaSummaryCardProps) {
  const visibleCategoryLabel =
    categoryLabel?.trim() || createDefaultCategoryLabel(product.categories);

  return (
    <Card>
      <GachaImageFrame>
        <GachaImageFallback aria-hidden="true">
          <LogoImagePlaceholder />
        </GachaImageFallback>
        <GachaImage
          src={product.thumbnailUrl}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </GachaImageFrame>
      <GachaName title={product.name}>{product.name}</GachaName>
      <CategoryText title={product.categories.join(', ')}>
        {visibleCategoryLabel}
      </CategoryText>
    </Card>
  );
}
