import styled from '@emotion/styled';

import MagnifierIcon from '@/assets/Magnifier.png';

export default function SearchHero() {
  return (
    <Wrapper>
      <Title>오늘은 어떤 가챠를 찾아볼까요?</Title>

      <SearchBar>
        <SearchIcon src={MagnifierIcon} alt="" />
        <SearchInput type="search" placeholder="가챠를 검색해 보세요" />
        <SearchButton type="button">검색</SearchButton>
      </SearchBar>
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

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 500px;
  padding: 8px 8px 8px 16px;
  border: 1px solid #eeeaec;
  border-radius: 16px;
  background: #ffffff;
`;

const SearchIcon = styled.img`
  flex: none;
  width: 18px;
  height: 18px;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 15px;
  color: #2b2528;
  background: transparent;

  &::placeholder {
    color: #9a9095;
  }
`;

const SearchButton = styled.button`
  flex: none;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  background: #ed174c;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`;
