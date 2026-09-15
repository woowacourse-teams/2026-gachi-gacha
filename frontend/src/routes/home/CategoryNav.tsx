import styled from '@emotion/styled';

interface Category {
  label: string;
}

const categories: Category[] = [
  { label: '전체' },
  { label: '산리오' },
  { label: '치이카와' },
  { label: '포켓몬' },
  { label: '짱구' },
  { label: '디즈니' },
  { label: '애니메이션' },
  { label: '게임' },
  { label: '피규어' },
  { label: '키링' },
  { label: '미니어처' },
];

export default function CategoryNav() {
  return (
    <Wrapper>
      {categories.map((category, index) => (
        <CategoryItem
          key={category.label}
          type="button"
          aria-pressed={index === 0}
        >
          <Label>{category.label}</Label>
        </CategoryItem>
      ))}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 20px;
  padding: 16px 24px;
  overflow-x: auto;
`;

const CategoryItem = styled.button`
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 8px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: #9a9095;
  cursor: pointer;

  &[aria-pressed='true'] {
    color: #ed174c;
    border-bottom-color: #ed174c;

    span {
      font-weight: 700;
    }
  }
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: inherit;
`;
