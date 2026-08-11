import KakaoMap from '@/components/kakaoMap/KakaoMap';
import type { StoreMapPin } from '@/components/kakaoMap/storePin';
import {
  StoreDetailSheetContainer,
  useStoreDetailSheet,
} from '@/features/storeDetail';

import { PageLayout } from './Map.styles';

const HONGDAE_CENTER = { lat: 37.5550659903951, lng: 126.925097731352 };
const STORE_PINS: StoreMapPin[] = [
  {
    storeId: 1,
    name: '가챠스테이션 홍대점',
    latitude: 37.5550659903951,
    longitude: 126.925097731352,
    distanceMeters: 380,
  },
];

export default function MapPage() {
  const { closeStoreDetail, openStoreDetail, selection, setState, state } =
    useStoreDetailSheet();

  return (
    <PageLayout>
      <KakaoMap
        center={HONGDAE_CENTER}
        pins={STORE_PINS}
        onStorePinClick={openStoreDetail}
      />
      <StoreDetailSheetContainer
        distanceMeters={selection?.distanceMeters}
        state={state}
        storeId={selection?.storeId ?? null}
        onClose={closeStoreDetail}
        onStateChange={setState}
      />
    </PageLayout>
  );
}
