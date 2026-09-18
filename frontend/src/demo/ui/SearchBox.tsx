import { useEffect, useRef, useState } from 'react';

import { searchDemoProducts } from '../data/demoData';
import type { DemoProduct } from '../demoType';
import { Icon } from './Icon';

export function SearchBox({
  onSelect,
  large = false,
}: {
  onSelect: (product: DemoProduct) => void;
  large?: boolean;
}) {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchDemoProducts(keyword);

  function close() {
    setIsOpen(false);
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (!isOpen) return;
    const onOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      )
        setIsOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onOutsideClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onOutsideClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={'promo-search-box' + (large ? ' is-large' : '')}
    >
      <form
        className="promo-search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const nextKeyword = input.trim();
          if (!nextKeyword) {
            inputRef.current?.focus();
            return;
          }
          setKeyword(nextKeyword);
          setVisibleCount(10);
          setIsOpen(true);
        }}
      >
        <Icon name="search" />
        <input
          ref={inputRef}
          aria-label="가챠 검색"
          placeholder="가챠 · 캐릭터 · 작품을 검색해 보세요"
          value={input}
          maxLength={100}
          onChange={(event) => setInput(event.target.value)}
          aria-expanded={isOpen}
          autoComplete="off"
        />
        <button className="promo-button promo-search-submit" type="submit">
          검색
        </button>
      </form>
      {isOpen && (
        <section
          className="promo-search-popover"
          role="dialog"
          aria-label="가챠 검색 결과"
        >
          <div className="promo-popover-heading">
            <div>
              <h2>“{keyword}” 검색 결과</h2>
              <p>마음에 드는 가챠를 골라 보유 매장 예시를 확인하세요.</p>
            </div>
            <button
              className="promo-icon-button"
              onClick={close}
              aria-label="검색 결과 닫기"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="promo-popover-meta">
            <strong>{results.length}개의 결과</strong>
            <span>체험용 상품 표본</span>
          </div>
          <div
            className="promo-popover-scroll"
            onScroll={(event) => {
              const target = event.currentTarget;
              if (
                target.scrollHeight - target.scrollTop - target.clientHeight <
                100
              )
                setVisibleCount((count) =>
                  Math.min(count + 10, results.length),
                );
            }}
          >
            {results.length ? (
              <div className="promo-popover-grid">
                {results.slice(0, visibleCount).map((product) => (
                  <button
                    key={product.id}
                    className="promo-popover-product"
                    onClick={() => {
                      setIsOpen(false);
                      onSelect(product);
                    }}
                  >
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <strong title={product.name}>{product.name}</strong>
                    <span>{product.categories.slice(0, 2).join(' · ')}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="promo-empty">
                <Icon name="search" size={32} />
                <h3>아직 준비된 예시가 없어요</h3>
                <p>산리오, 쿠로미, 시나모롤, 포켓몬으로 체험해 보세요.</p>
              </div>
            )}
            {visibleCount < results.length && (
              <button
                className="promo-button is-outline promo-load-more"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(count + 10, results.length),
                  )
                }
              >
                가챠 더 보기 <Icon name="plus" size={16} />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
