import styled from '@emotion/styled';

import { GachaSearchNavigationBar } from '@/features/gachaSearch/GachaSearchNavigationBar';

export default function SearchHero() {
  return (
    <Wrapper>
      <Title>오늘은 어떤 가챠를 찾아볼까요?</Title>

      <SearchArea>
        <GachaSearchNavigationBar />
      </SearchArea>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px 24px;
  text-align: center;
`;

const Title = styled.p`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2b2528;
`;

const SearchArea = styled.div`
  width: 100%;
  max-width: 500px;
`;
