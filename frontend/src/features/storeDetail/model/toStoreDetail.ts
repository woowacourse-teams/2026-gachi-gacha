import type {
  StoreDetail,
  StoreDetailPrice,
  StoreDetailSocialLink,
} from './storeDetail';
import type { StoreDetailDto } from '../api/storeDetail.dto';

interface ToStoreDetailOptions {
  distanceMeters?: number;
  gachaImageUrls?: string[];
  gachaTotalPages?: number;
  isGachaCatalogLoaded?: boolean;
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
  const normalizedMinPrice =
    minPrice !== null && minPrice > 0 ? minPrice : null;
  const normalizedMaxPrice =
    maxPrice !== null && maxPrice > 0 ? maxPrice : null;

  if (normalizedMinPrice === null && normalizedMaxPrice === null) return null;
  if (normalizedMinPrice === null) {
    return normalizedMaxPrice === null
      ? null
      : `${formatWon(normalizedMaxPrice)}까지`;
  }
  if (normalizedMaxPrice === null) {
    return `${formatWon(normalizedMinPrice)}부터`;
  }
  if (normalizedMinPrice === normalizedMaxPrice) {
    return formatWon(normalizedMinPrice);
  }

  return `${formatWon(normalizedMinPrice)} ~ ${formatWon(normalizedMaxPrice)}`;
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
    dto.coinPrice === null || dto.coinPrice <= 0
      ? null
      : { label: '코인 1개', value: formatWon(dto.coinPrice) },
    createPrice('가챠', dto.gachaPriceMin, dto.gachaPriceMax),
    createPrice('쿠지', dto.kujiPriceMin, dto.kujiPriceMax),
    createPrice('선택 가챠', dto.selectGachaPriceMin, dto.selectGachaPriceMax),
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
    (dto.gachaMachineAmount !== null && dto.gachaMachineAmount > 0) ||
    (dto.gachaPriceMin !== null && dto.gachaPriceMin > 0) ||
    (dto.gachaPriceMax !== null && dto.gachaPriceMax > 0);
  const hasKuji =
    (dto.kujiAmount !== null && dto.kujiAmount > 0) ||
    (dto.kujiPriceMin !== null && dto.kujiPriceMin > 0) ||
    (dto.kujiPriceMax !== null && dto.kujiPriceMax > 0);

  if (hasGacha) categories.push('가챠');
  if (hasKuji) categories.push('쿠지');
  if (dto.hasRandomBox) categories.push('랜덤 가챠');
  if (
    dto.hasSelectGacha ||
    (dto.selectGachaPriceMin !== null && dto.selectGachaPriceMin > 0) ||
    (dto.selectGachaPriceMax !== null && dto.selectGachaPriceMax > 0)
  ) {
    categories.push('선택 가챠');
  }

  return categories;
}

function createPaymentMethods(paymentMethods: string | null) {
  if (!paymentMethods) return [];

  return paymentMethods
    .split(',')
    .map((paymentMethod) => paymentMethod.trim())
    .filter(Boolean);
}

export function toStoreDetail(
  dto: StoreDetailDto,
  options: ToStoreDetailOptions = {},
): StoreDetail {
  const instagram = createInstagram(dto.instagramId);
  const imageUrls = Array.from(
    new Set(
      [dto.thumbnailUrl, ...dto.images.map(({ imageUrl }) => imageUrl)].filter(
        (imageUrl): imageUrl is string => imageUrl !== null,
      ),
    ),
  );

  return {
    id: dto.storeId,
    name: dto.name,
    address: dto.address,
    businessHours: dto.businessHours ?? '정보 없음',
    imageUrls,
    gachaImageUrls: Array.from(new Set(options.gachaImageUrls ?? [])),
    gachaTotalPages: options.gachaTotalPages ?? 0,
    isGachaCatalogLoaded: options.isGachaCatalogLoaded === true,
    phone: dto.phoneNumber,
    socialLinks: instagram ? [instagram] : [],
    categories: createCategories(dto),
    paymentMethods: createPaymentMethods(dto.paymentMethods),
    facilities: [...dto.facilities],
    machineAmount: formatAmountRange(dto.gachaMachineAmount, '대'),
    kujiAmount: formatAmountRange(dto.kujiAmount, '개'),
    prices: createPrices(dto),
    hasRandomBox: dto.hasRandomBox,
    hasSelectGacha: dto.hasSelectGacha === true,
    updatedAt: formatUpdatedAt(dto.updatedAt),
    distance: formatDistance(options.distanceMeters),
  };
}
