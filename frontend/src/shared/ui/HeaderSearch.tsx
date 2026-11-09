import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import { preventIosInputZoom } from '@/shared/styles/preventIosInputZoom';

export function HeaderSearch({
  keyword = '',
  backTo,
  autoFocusMobile = false,
  onSearch,
  onClear,
}: {
  keyword?: string;
  backTo?: string;
  autoFocusMobile?: boolean;
  onSearch: (value: string) => void;
  onClear?: () => void;
}) {
  const [value, setValue] = useState(keyword);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      autoFocusMobile &&
      !keyword &&
      window.matchMedia?.('(max-width: 767px)').matches
    ) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [autoFocusMobile, keyword]);

  return (
    <Form
      role="search"
      aria-label="통합 검색"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value);
      }}
    >
      {backTo && (
        <Back to={backTo} aria-label="검색을 시작한 화면으로 돌아가기">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m15 5-7 7 7 7" />
          </svg>
        </Back>
      )}
      <Field>
        <Input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          aria-label="검색어"
          placeholder="교환글, 가챠, 매장 검색"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        {value && (
          <Clear
            type="button"
            aria-label="검색어 지우기"
            onClick={() => {
              setValue('');
              onClear?.();
            }}
          >
            ×
          </Clear>
        )}
        <Submit type="submit" aria-label="검색 실행">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </Submit>
      </Field>
    </Form>
  );
}

const Form = styled.form`
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 6px;
`;

const Back = styled(Link)`
  display: none;

  @media (max-width: 767px) {
    display: grid;
    width: 40px;
    min-height: 44px;
    place-items: center;
    color: inherit;
  }
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  min-height: 44px;
  flex: 1;
  align-items: center;
  padding-inline: 14px 4px;
  @media (min-width: 768px) {
    padding-inline: 8px 12px;
  }
  border-radius: 999px;
  background: #f5f4f3;
`;

const Input = styled.input`
  min-width: 0;
  flex: 1;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  outline: 0;

  &::-webkit-search-cancel-button {
    display: none;
  }

  ${preventIosInputZoom}
`;

const Submit = styled.button`
  display: grid;
  width: 40px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  @media (min-width: 768px) {
    width: 28px;
    order: -1;
  }
`;

const Clear = styled(Submit)`
  order: 1;
  font-size: 20px;
  @media (min-width: 768px) {
    order: 1;
  }
`;
