import styled from '@emotion/styled';

import { AppGachaSearchHeader } from '@/features/gachaSearch/AppGachaSearchHeader';

import TradeForm from './components/TradeForm';

export default function TradeCreatePage() {
  return (
    <Page>
      <AppGachaSearchHeader currentPath="/trade" />

      <Main>
        <Heading>
          <Title>거래 글쓰기</Title>
          <Description>
            거래할 가챠의 사진과 정보를 입력하면 피드에 올라가요.
          </Description>
        </Heading>

        <TradeForm />
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
