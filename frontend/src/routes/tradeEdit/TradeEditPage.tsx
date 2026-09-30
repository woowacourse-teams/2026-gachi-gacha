import styled from '@emotion/styled';

import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import type { TradePlaceInput } from '@/domains/trade/tradeCreateType';
import type { TradeDetail } from '@/domains/trade/tradeDetailType';
import { AppGachaSearchHeader } from '@/features/gachaSearch/AppGachaSearchHeader';
import TradeForm, {
  type TradeFormInitialValues,
} from '@/routes/tradeCreate/components/TradeForm/TradeForm';

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
  };

  return (
    <Page>
      <AppGachaSearchHeader currentPath="/trade" />

      <Main>
        <Heading>
          <Title>교환 글 수정</Title>
          <Description>
            등록한 교환 정보를 확인하고 수정할 수 있어요.
          </Description>
        </Heading>

        <TradeForm mode="edit" initialValues={initialValues} />
      </Main>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  box-sizing: border-box;
  min-height: 100dvh;
  padding-bottom: 85px;
  flex-direction: column;
  background: #ffffff;
`;

const Main = styled.main`
  box-sizing: border-box;
  width: min(100%, 960px);
  margin: 0 auto;
  padding: 48px 24px 72px;
  flex: 1;

  @media (max-width: 680px) {
    padding: 32px 16px 48px;
  }
`;

const Heading = styled.div`
  margin-bottom: 36px;
`;

const Title = styled.h1`
  margin: 0 0 10px;
  color: #202126;
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const Description = styled.p`
  margin: 0;
  color: #73757e;
  font-size: 16px;
  line-height: 1.6;
`;
