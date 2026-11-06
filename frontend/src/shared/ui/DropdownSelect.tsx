import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import {
  Chevron,
  ChevronBadge,
  Option,
  Options,
  SelectedMark,
  SelectedValue,
  SelectRoot,
  SelectTrigger,
} from './DropdownSelect.styles';

export interface DropdownSelectOption<Value extends string> {
  value: Value;
  label: string;
}

interface DropdownSelectProps<Value extends string> {
  ariaLabel: string;
  showInlineLabel?: boolean;
  value: Value;
  options: readonly DropdownSelectOption<Value>[];
  onChange: (value: Value) => void;
}

export function DropdownSelect<Value extends string>({
  ariaLabel,
  showInlineLabel = false,
  value,
  options,
  onChange,
}: DropdownSelectProps<Value>) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  function openMenu(index = selectedIndex) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  function closeMenu({ restoreFocus = false } = {}) {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function selectOption(index: number) {
    const option = options[index];

    if (!option) {
      return;
    }

    if (option.value !== value) {
      onChange(option.value);
    }

    closeMenu({ restoreFocus: true });
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isOpen) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();
        openMenu();
      }

      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(options.length - 1, 0));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(activeIndex);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    }
  }

  return (
    <SelectRoot
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <SelectTrigger
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-activedescendant={
          isOpen ? `${listboxId}-option-${activeIndex}` : undefined
        }
        onClick={() => {
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {showInlineLabel && (
          <span data-select-label aria-hidden="true">
            {ariaLabel}
          </span>
        )}
        <SelectedValue>{selectedOption?.label}</SelectedValue>
        <ChevronBadge aria-hidden="true">
          <Chevron />
        </ChevronBadge>
      </SelectTrigger>

      {isOpen && (
        <Options
          id={listboxId}
          role="listbox"
          aria-label={`${ariaLabel} 선택지`}
          onMouseDown={(event) => event.preventDefault()}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <Option
                id={`${listboxId}-option-${index}`}
                key={option.value}
                role="option"
                aria-selected={isSelected}
                data-active={activeIndex === index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(index)}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <SelectedMark aria-hidden="true">✓</SelectedMark>
                )}
              </Option>
            );
          })}
        </Options>
      )}
    </SelectRoot>
  );
}
