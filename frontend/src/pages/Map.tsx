import styled from '@emotion/styled';

import KakaoMap from '@/components/kakaoMap/KakaoMap';

const DEFAULT_CENTER = { lat: 37.5550659903951, lng: 126.925097731352 };

export default function MapPage() {
  return (
    <PageLayout>
      <KakaoMap center={DEFAULT_CENTER} />
    </PageLayout>
  );
}

const PageLayout = styled.div`
  width: 100%;
  height: 100%;
`;
