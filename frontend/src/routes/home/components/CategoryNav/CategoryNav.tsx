import styled from '@emotion/styled';

import { CATEGORIES } from '../../model/categories';

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryNav(props: Props) {
  //고민되는 부분 props로 카테고리를 넘기는게 좋을지? 아니면 카테고리를 여기내부에서 사용하는게 좋을지?
  return (
    <Wrapper>
      {CATEGORIES.map((category) => (
        <CategoryItem
          key={category}
          type="button"
          aria-pressed={category === props.selected}
          onClick={() => props.onSelect(category)}
        >
          <Label>{category}</Label>
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
  border-bottom: 1px solid #eeeaec;
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
