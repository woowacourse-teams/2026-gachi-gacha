import styled from '@emotion/styled';

import MapPage from './pages/Map';

const MobileLayout = styled.div`
  width: 100%;
  max-width: 430px;
  height: 100dvh;
  margin: 0 auto;
`;

export default function App() {
  return (
    <MobileLayout>
      <MapPage />
    </MobileLayout>
  );
}
