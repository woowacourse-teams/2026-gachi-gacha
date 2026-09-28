import { useState } from 'react';
import styled from '@emotion/styled';

import PhotoUploader from '../PhotoUploader';

const CATEGORIES = ['산리오', '키링', '피규어', '미니어처'] as const;

export default function TradeForm() {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0],
  );

  return (
    <Form
      id="secondhand-create-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <PhotoUploader />

      <Field>
        <Label htmlFor="trade-title">제목</Label>
        <Input
          id="trade-title"
          name="title"
          placeholder="교환할 가챠를 알아보기 쉽게 적어주세요"
        />
      </Field>

      <Field>
        <Label>카테고리</Label>
        <CategoryList>
          {CATEGORIES.map((category) => (
            <CategoryButton
              key={category}
              type="button"
              data-selected={category === selectedCategory}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </CategoryButton>
          ))}
        </CategoryList>
      </Field>

      <Field>
        <Label htmlFor="trade-request">원하는 교환</Label>
        <Input
          id="trade-request"
          name="request"
          placeholder="예: 시나모롤 키링 또는 산리오 랜덤 교환"
        />
      </Field>

      <FieldRow>
        <Field>
          <Label htmlFor="trade-place">교환 장소</Label>
          <IconInputWrapper>
            <LocationIcon aria-hidden="true" />
            <IconInput
              id="trade-place"
              name="place"
              placeholder="교환할 장소를 입력해주세요"
            />
          </IconInputWrapper>
        </Field>

        <Field>
          <Label htmlFor="trade-time">가능 시간</Label>
          <IconInputWrapper>
            <ClockIcon aria-hidden="true" />
            <IconInput
              id="trade-time"
              name="availableTime"
              placeholder="예: 오늘 19:30 이후"
            />
          </IconInputWrapper>
        </Field>
      </FieldRow>

      <Field>
        <Label htmlFor="trade-description">설명</Label>
        <Textarea
          id="trade-description"
          name="description"
          placeholder="가챠의 상태와 교환 방법을 자세히 적어주세요"
        />
      </Field>
    </Form>
  );
}

function LocationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <path
        d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 10px;
`;

const FieldRow = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 680px) {
    flex-direction: column;
  }
`;

const Label = styled.label`
  color: #242429;
  font-size: 15px;
  font-weight: 800;
`;

const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  outline: none;
  background: #f7f7f8;
  color: #242429;
  font-size: 15px;

  &::placeholder {
    color: #92949c;
  }

  &:focus {
    border-color: #ed174c;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgb(237 23 76 / 10%);
  }
`;

const IconInputWrapper = styled.div`
  position: relative;
  color: #ed174c;

  > svg {
    position: absolute;
    z-index: 1;
    top: 50%;
    left: 16px;
    transform: translateY(-50%);
    pointer-events: none;
  }
`;

const IconInput = styled(Input)`
  padding-left: 46px;
`;

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryButton = styled.button`
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #f5f5f6;
  color: #6e7078;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &[data-selected='true'] {
    background: #ed174c;
    color: #ffffff;
  }
`;

const Textarea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 132px;
  padding: 16px;
  resize: vertical;
  border: 1px solid transparent;
  border-radius: 12px;
  outline: none;
  background: #f7f7f8;
  color: #242429;
  font-size: 15px;
  line-height: 1.6;

  &::placeholder {
    color: #92949c;
  }

  &:focus {
    border-color: #ed174c;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgb(237 23 76 / 10%);
  }
`;
