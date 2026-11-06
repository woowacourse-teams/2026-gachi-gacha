import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import type { TradePlaceInput } from '@/domains/trade/tradeCreateType';
import type { TradeDetail } from '@/domains/trade/tradeDetailType';
import TradeForm, {
  type TradeFormInitialValues,
} from '@/routes/tradeCreate/components/TradeForm/TradeForm';
import TradeFormLayout from '@/routes/tradeCreate/components/TradeFormLayout';

interface TradeEditPageProps {
  detail: TradeDetail;
  categories: TradeCategory[];
}

function toPlaceInput(
  place: TradeDetail['tradePlace'],
): TradePlaceInput | null {
  if (!place) {
    return null;
  }

  return {
    ...(place.name ? { name: place.name } : {}),
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

export default function TradeEditPage({
  detail,
  categories,
}: TradeEditPageProps) {
  const initialValues: TradeFormInitialValues = {
    title: detail.title,
    description: detail.description ?? '',
    desiredProduction: detail.desiredProduction ?? '',
    categories,
    purchaseStore: toPlaceInput(detail.purchaseStore),
    tradePlace: toPlaceInput(detail.tradePlace),
    imageUrls: detail.imageUrls,
    availableTime: detail.availableTime,
  };

  return (
    <TradeFormLayout
      title="거래 글 수정"
      backTo={`/trade/${detail.tradeId}`}
      backLabel="거래 상세로 돌아가기"
    >
      <TradeForm
        mode="edit"
        tradeId={detail.tradeId}
        initialValues={initialValues}
      />
    </TradeFormLayout>
  );
}
