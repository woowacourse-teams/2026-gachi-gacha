import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import {
  CategoryText,
  Eyebrow,
  Information,
  LoadingText,
  LoadingThumbnail,
  ProductName,
  StateMessage,
  Summary,
  Thumbnail,
  ThumbnailFallback,
  ThumbnailFrame,
} from './SelectedGachaSummary.styles';

export interface SelectedGachaSummaryProps {
  selectedGacha: AsyncState<GachaProductSummary>;
}

const MAX_VISIBLE_CATEGORIES = 3;

function getCategoryLabel(categories: readonly string[]): string {
  if (categories.length === 0) {
    return '카테고리 미등록';
  }

  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hiddenCategoryCount = categories.length - visibleCategories.length;
  const label = visibleCategories.join(' · ');

  return hiddenCategoryCount > 0
    ? `${label} 외 ${hiddenCategoryCount}개`
    : label;
}

export function SelectedGachaSummary({
  selectedGacha,
}: SelectedGachaSummaryProps) {
  if (selectedGacha.status === 'idle') {
    return null;
  }

  if (selectedGacha.status === 'loading') {
    return (
      <Summary aria-label="선택한 가챠를 불러오는 중" aria-busy="true">
        <LoadingThumbnail aria-hidden="true" />
        <LoadingText aria-hidden="true" />
      </Summary>
    );
  }

  if (selectedGacha.status === 'error') {
    return (
      <Summary role="alert">
        <StateMessage>{selectedGacha.errorMessage}</StateMessage>
      </Summary>
    );
  }

  const { name, thumbnailUrl, categories } = selectedGacha.data;

  return (
    <Summary aria-label="선택한 가챠">
      <ThumbnailFrame>
        <ThumbnailFallback aria-hidden="true">
          <LogoImagePlaceholder />
        </ThumbnailFallback>
        <Thumbnail
          src={thumbnailUrl}
          alt={`${name} 섬네일`}
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </ThumbnailFrame>
      <Information>
        <Eyebrow>이 가챠를 보유한 매장을 보고 있어요</Eyebrow>
        <ProductName title={name}>{name}</ProductName>
        <CategoryText title={categories.join(', ')}>
          {getCategoryLabel(categories)}
        </CategoryText>
      </Information>
    </Summary>
  );
}
