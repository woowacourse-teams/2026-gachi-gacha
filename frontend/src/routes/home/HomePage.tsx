import styled from '@emotion/styled';

import CategoryFeed from './components/CategoryFeed';
import Header from './components/Header';
import SearchHero from './components/SearchHero';

export default function HomePage() {
  return (
    <Page>
      <Header />

      <Main>
        <SearchHero />
        <CategoryFeed />
      </Main>

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
