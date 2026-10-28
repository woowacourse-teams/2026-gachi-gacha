import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import {
  SearchForm,
  SearchIcon,
  SearchInput,
  SearchRoot,
  SearchSubmitButton,
} from '@/shared/ui/SearchBarPrimitives';
import { SearchHeroLayout } from '@/shared/ui/SearchHeroLayout';

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
    <SearchHeroLayout title={title}>
      <SearchRoot>
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
          <SearchSubmitButton type="submit">검색</SearchSubmitButton>
        </SearchForm>
      </SearchRoot>
    </SearchHeroLayout>
  );
}
