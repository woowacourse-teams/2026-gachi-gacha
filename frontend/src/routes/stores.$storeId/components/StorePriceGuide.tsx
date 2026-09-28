import { useId } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import {
  PriceLabel,
  PriceList,
  PriceRow,
  PriceValue,
  Section,
  SectionTitle,
} from './StorePriceGuide.styles';

interface StorePriceGuideProps {
  store: Pick<
    StoreDetailResponseDto,
    | 'coinPrice'
    | 'gachaPriceMin'
    | 'gachaPriceMax'
    | 'kujiPriceMin'
    | 'kujiPriceMax'
    | 'selectGachaPriceMin'
    | 'selectGachaPriceMax'
  >;
}

interface StorePriceItem {
  id: string;
  label: string;
  value: string;
}

const priceFormatter = new Intl.NumberFormat('ko-KR');

function formatPrice(price: number): string {
  return `${priceFormatter.format(price)}원`;
}

function formatPriceRange(
  minimumPrice: number | null,
  maximumPrice: number | null,
): string | null {
  const minimum =
    minimumPrice !== null && minimumPrice > 0 ? minimumPrice : null;
  const maximum =
    maximumPrice !== null && maximumPrice > 0 ? maximumPrice : null;

  if (minimum === null) {
    return maximum === null ? null : `${formatPrice(maximum)}까지`;
  }
  if (maximum === null) return `${formatPrice(minimum)}부터`;
  if (minimum === maximum) return formatPrice(minimum);

  return `${formatPrice(minimum)} ~ ${formatPrice(maximum)}`;
}

function createPriceItem(
  id: string,
  label: string,
  minimumPrice: number | null,
  maximumPrice: number | null,
): StorePriceItem | null {
  const value = formatPriceRange(minimumPrice, maximumPrice);

  return value ? { id, label, value } : null;
}

export function StorePriceGuide({ store }: StorePriceGuideProps) {
  const titleId = useId();
  const prices = [
    store.coinPrice !== null && store.coinPrice > 0
      ? {
          id: 'coin',
          label: '코인 1개',
          value: formatPrice(store.coinPrice),
        }
      : null,
    createPriceItem('gacha', '가챠', store.gachaPriceMin, store.gachaPriceMax),
    createPriceItem('kuji', '쿠지', store.kujiPriceMin, store.kujiPriceMax),
    createPriceItem(
      'select-gacha',
      '선택 가챠',
      store.selectGachaPriceMin,
      store.selectGachaPriceMax,
    ),
  ].filter((price): price is StorePriceItem => price !== null);

  if (prices.length === 0) {
    return null;
  }

  return (
    <Section aria-labelledby={titleId}>
      <SectionTitle id={titleId}>가격 안내</SectionTitle>
      <PriceList>
        {prices.map(({ id, label, value }) => (
          <PriceRow key={id}>
            <PriceLabel>{label}</PriceLabel>
            <PriceValue>{value}</PriceValue>
          </PriceRow>
        ))}
      </PriceList>
    </Section>
  );
}
