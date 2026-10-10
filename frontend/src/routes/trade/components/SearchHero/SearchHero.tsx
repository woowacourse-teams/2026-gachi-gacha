import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  fontWeight,
  radius,
  space,
} from '@/shared/styles/tokens';

export interface SearchHeroProps {
  title: string;
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export default function SearchHero({
  title,
  initialQuery = '',
  onSearch,
}: SearchHeroProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <Hero>
      <Title>{title}</Title>

      <SearchArea>
        <SearchForm role="search" onSubmit={handleSubmit}>
          <SearchIcon viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="11"
              cy="11"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="m16 16 4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </SearchIcon>
          <SearchInput
            type="search"
            value={query}
            placeholder="찾고 싶은 게시글을 검색"
            aria-label="교환 게시글 검색어"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <SearchButton type="submit">검색</SearchButton>
        </SearchForm>
      </SearchArea>
    </Hero>
  );
}

const Hero = styled.section`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: ${space.lg};
  padding: ${space.xxl} ${space.xl};
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  color: #2b2528;
  font-size: 20px;
  font-weight: ${fontWeight.bold};
`;

const SearchArea = styled.div`
  width: 100%;
  max-width: 500px;
`;

const SearchForm = styled.form`
  display: flex;
  width: 100%;
  min-height: 52px;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 18px;
  border: 1px solid ${color.border};
  border-radius: 16px;
  background: ${color.surface};
  box-shadow: 0 6px 18px rgb(35 31 32 / 6%);

  &:focus-within {
    border-color: ${color.primary};
    box-shadow: 0 0 0 3px rgb(217 59 84 / 12%);
  }

  @media (max-width: ${breakpoint.mobile}) {
    min-height: 48px;
    padding-left: 14px;
    border-radius: 14px;
  }
`;

const SearchIcon = styled.svg`
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  color: ${color.textMuted};
`;

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${color.text};
  font: inherit;
  font-size: 15px;
  line-height: 1.5;

  &::placeholder {
    color: ${color.textSubtle};
  }

  &::-webkit-search-cancel-button {
    cursor: pointer;
  }
`;

const SearchButton = styled.button`
  min-width: 72px;
  align-self: stretch;
  padding: 0 18px;
  border: 0;
  border-radius: ${radius.control};
  background: ${color.primary};
  color: ${color.surface};
  font: inherit;
  font-size: 14px;
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:hover {
    background: ${color.primaryHover};
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }

  @media (max-width: ${breakpoint.mobile}) {
    min-width: 58px;
    padding: 0 14px;
  }
`;
