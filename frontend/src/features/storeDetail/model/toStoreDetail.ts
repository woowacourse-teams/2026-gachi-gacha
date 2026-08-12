import type {
  StoreDetail,
  StoreDetailPrice,
  StoreDetailSocialLink,
} from './storeDetail';
import type { StoreDetailDto } from '../api/storeDetail.dto';

interface ToStoreDetailOptions {
  distanceMeters?: number;
}

const AMOUNT_RANGES = [
  { max: 10, min: 1 },
  { max: 30, min: 11 },
  { max: 50, min: 31 },
  { max: 100, min: 51 },
] as const;
const MAX_RANGE_AMOUNT = 100;

const wonFormatter = new Intl.NumberFormat('ko-KR');
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function formatAmountRange(amount: number | null, unit: string) {
  if (amount === null) return '정보 없음';
  if (amount <= 0) return '없음';

  const range = AMOUNT_RANGES.find(({ max }) => amount <= max);

  return range
    ? `${range.min}~${range.max}${unit}`
    : `${MAX_RANGE_AMOUNT + 1}${unit} 이상`;
}

function formatWon(price: number) {
  return `${wonFormatter.format(price)}원`;
}

function formatPriceRange(minPrice: number | null, maxPrice: number | null) {
  if (minPrice === null && maxPrice === null) return null;
  if (minPrice === null) {
    return maxPrice === null ? null : `${formatWon(maxPrice)}까지`;
  }
  if (maxPrice === null) return `${formatWon(minPrice)}부터`;
  if (minPrice === maxPrice) return formatWon(minPrice);

  return `${formatWon(minPrice)} ~ ${formatWon(maxPrice)}`;
}

function createPrice(
  label: string,
  minPrice: number | null,
  maxPrice: number | null,
) {
  const value = formatPriceRange(minPrice, maxPrice);

  return value ? { label, value } : null;
}

function createPrices(dto: StoreDetailDto) {
  const prices: Array<StoreDetailPrice | null> = [
    dto.coinPrice === null
      ? null
      : { label: '코인 1개', value: formatWon(dto.coinPrice) },
    createPrice('가챠', dto.gachaMinPrice, dto.gachaMaxPrice),
    createPrice('쿠지', dto.kujiMinPrice, dto.kujiMaxPrice),
    createPrice('선택 가챠', dto.selectGachaMinPrice, dto.selectGachaMaxPrice),
  ];

  return prices.filter((price): price is StoreDetailPrice => price !== null);
}

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt);

  return Number.isNaN(date.getTime()) ? updatedAt : dateFormatter.format(date);
}

function formatDistance(distanceMeters?: number) {
  if (distanceMeters === undefined) return null;
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)}m`;

  const kilometers = distanceMeters / 1_000;
  const digits = Number.isInteger(kilometers) ? 0 : 1;

  return `${kilometers.toFixed(digits)}km`;
}

function createInstagram(instagramId: string | null) {
  if (!instagramId) return null;

  const id = instagramId.replace(/^@/, '');

  return {
    platform: 'instagram',
    url: `https://www.instagram.com/${encodeURIComponent(id)}`,
  } satisfies StoreDetailSocialLink;
}

function createCategories(dto: StoreDetailDto) {
  const categories: string[] = [];
  const hasGacha =
    dto.machineAmount !== 0 ||
    dto.gachaMinPrice !== null ||
    dto.gachaMaxPrice !== null;
  const hasKuji =
    (dto.kujiAmount !== null && dto.kujiAmount > 0) ||
    dto.kujiMinPrice !== null ||
    dto.kujiMaxPrice !== null;

  if (hasGacha) categories.push('가챠');
  if (hasKuji) categories.push('쿠지');
  if (dto.hasRandomBox) categories.push('랜덤 가챠');
  if (
    dto.hasSelectGacha ||
    dto.selectGachaMinPrice !== null ||
    dto.selectGachaMaxPrice !== null
  ) {
    categories.push('선택 가챠');
  }

  return categories;
}

export function toStoreDetail(
  dto: StoreDetailDto,
  options: ToStoreDetailOptions = {},
): StoreDetail {
  const instagram = createInstagram(dto.instagramId);
  const imageUrls = Array.from(
    new Set(
      [dto.thumbnailUrl, ...dto.imageUrls].filter(
        (imageUrl): imageUrl is string => imageUrl !== null,
      ),
    ),
  );

  return {
    id: dto.storeId,
    name: dto.name,
    address: dto.address,
    businessHours: dto.businessHours,
    imageUrls,
    phone: dto.phone,
    socialLinks: instagram ? [instagram] : [],
    categories: createCategories(dto),
    paymentMethods: [...dto.paymentMethods],
    facilities: [...dto.facilities],
    machineAmount: formatAmountRange(dto.machineAmount, '대'),
    kujiAmount: formatAmountRange(dto.kujiAmount, '개'),
    prices: createPrices(dto),
    hasRandomBox: dto.hasRandomBox,
    hasSelectGacha: dto.hasSelectGacha,
    updatedAt: formatUpdatedAt(dto.updatedAt),
    distance: formatDistance(options.distanceMeters),
  };
}
