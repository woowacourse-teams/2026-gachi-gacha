import styled from '@emotion/styled';

import { AppGachaSearchHeader } from '@/features/gachaSearch/AppGachaSearchHeader';

import CategoryFeed from './components/CategoryFeed';
import Footer from './components/Footer';
import SearchHero from './components/SearchHero';

export default function HomePage() {
  return (
    <Page>
      <AppGachaSearchHeader currentPath="/" />

      <Main>
        <SearchHero />
        <CategoryFeed />
      </Main>

      <Footer />
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;
