import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

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
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsidePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscapeKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      setIsOpen(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    document.addEventListener('keydown', handleEscapeKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
      document.removeEventListener('keydown', handleEscapeKeyDown);
    };
  }, [isOpen]);

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

  function closeSearchResults() {
    setIsOpen(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSelect(gachaId: number) {
    setIsOpen(false);
    onSelect(gachaId);
  }

  return (
    <SearchRoot ref={rootRef}>
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
          ref={inputRef}
          type="search"
          value={inputValue}
          placeholder="찾고 싶은 가챠를 검색"
          aria-label="가챠 검색어"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popoverId : undefined}
          onChange={handleInputChange}
        />
        <SubmitButton type="submit">검색</SubmitButton>
      </SearchForm>

      {isOpen && (
        <GachaSearchPopoverContainer
          id={popoverId}
          query={submittedQuery}
          onClose={closeSearchResults}
          onSelect={handleSelect}
        />
      )}
    </SearchRoot>
  );
}
