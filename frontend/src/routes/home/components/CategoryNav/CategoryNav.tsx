import styled from '@emotion/styled';

import { CATEGORIES } from '../../model/categories';

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryNav(props: Props) {
  return (
    <Wrapper aria-label="가챠 카테고리">
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

const Wrapper = styled.nav`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 20px;
  padding: 16px 24px;
  overflow-x: auto;
  border-bottom: 1px solid #eeeaec;
  overscroll-behavior-x: contain;
  scroll-padding-inline: 16px;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;

  @media (min-width: 768px) {
    justify-content: center;
  }
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
  scroll-snap-align: start;

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
