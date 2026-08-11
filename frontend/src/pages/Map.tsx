import styled from '@emotion/styled';

import KakaoMap from '@/components/kakaoMap/KakaoMap';

const SEOUL_CITY_HALL = { lat: 37.5550659903951, lng: 126.925097731352 };

export default function MapPage() {
  return (
    <PageLayout>
      <KakaoMap center={SEOUL_CITY_HALL} />
    </PageLayout>
  );
}

const PageLayout = styled.div`
  width: 100%;
  height: 100%;
`;
