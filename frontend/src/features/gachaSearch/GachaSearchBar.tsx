import { useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';

import {
  SearchForm,
  SearchIcon,
  SearchInput,
  SearchRoot,
  SubmitButton,
} from './GachaSearchBar.styles';
import { GachaSearchPopoverContainer } from './GachaSearchPopoverContainer';

export interface GachaSearchBarProps {
  initialQuery?: string;
  onSelect: (gachaId: number) => void;
}

export function GachaSearchBar({
  initialQuery = '',
  onSelect,
}: GachaSearchBarProps) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setInputValue(event.currentTarget.value);
    setIsOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = inputValue.trim();

    if (!normalizedQuery) {
      setIsOpen(false);
      return;
    }

    setSubmittedQuery(normalizedQuery);
    setIsOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function handleSelect(gachaId: number) {
    setIsOpen(false);
    onSelect(gachaId);
  }

  return (
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
          value={inputValue}
          placeholder="찾고 싶은 가챠를 검색"
          aria-label="가챠 검색어"
          aria-expanded={isOpen}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <SubmitButton type="submit">검색</SubmitButton>
      </SearchForm>

      {isOpen && (
        <GachaSearchPopoverContainer
          query={submittedQuery}
          onClose={() => setIsOpen(false)}
          onSelect={handleSelect}
        />
      )}
    </SearchRoot>
  );
}
