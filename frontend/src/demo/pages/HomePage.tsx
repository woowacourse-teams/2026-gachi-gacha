import { useState } from 'react';

import { demoProducts } from '../data/demoData';
import type { DemoProduct } from '../demoType';
import { Icon, type IconName } from '../ui/Icon';
import { ProductCard } from '../ui/ProductCard';
import { SearchBox } from '../ui/SearchBox';

const categories = [
  '전체',
  '산리오',
  '치이카와',
  '포켓몬',
  '짱구',
  '디즈니',
  '애니메이션',
  '게임',
  '피규어',
  '키링',
  '미니어처',
] as const;

const categoryIcons = {
  전체: 'grid',
  산리오: 'cat',
  치이카와: 'rabbit',
  포켓몬: 'bolt',
  짱구: 'user',
  디즈니: 'sparkle',
  애니메이션: 'box',
  게임: 'gamepad',
  피규어: 'box',
  키링: 'key',
  미니어처: 'miniature',
} satisfies Record<(typeof categories)[number], IconName>;

export function HomePage({
  navigate,
  onProductSelect,
  likes,
  onLike,
  notify,
}: {
  navigate: (href: string) => void;
  onProductSelect: (product: DemoProduct) => void;
  likes: ReadonlySet<number>;
  onLike: (id: number) => void;
  notify: (title: string, message: string) => void;
}) {
  const [category, setCategory] = useState<string>('전체');
  const [showAll, setShowAll] = useState(false);
  const products =
    category === '전체'
      ? demoProducts
      : demoProducts.filter((product) => product.categories.includes(category));

  return (
    <>
      <section className="promo-hero">
        <p className="promo-eyebrow">작은 캡슐, 새로운 발견</p>
        <h1>오늘은 어떤 가챠를 뽑아볼까요?</h1>
        <SearchBox onSelect={onProductSelect} large />
        <div
          className="promo-category-tabs"
          role="group"
          aria-label="가챠 카테고리"
        >
          {categories.map((label) => (
            <button
              key={label}
              className={category === label ? 'is-active' : ''}
              aria-pressed={category === label}
              onClick={() => {
                setCategory(label);
                setShowAll(false);
              }}
            >
              <Icon name={categoryIcons[label]} size={23} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>
      <main className="promo-container promo-home-content">
        <aside className="promo-alert-banner">
          <div>
            <strong>찾는 가챠가 품절이었나요? 입고 알림을 받아보세요</strong>
            <p>
              원하는 가챠를 등록하면 근처 매장의 입고 소식을 알려드릴
              예정이에요.
            </p>
          </div>
          <button
            className="promo-button"
            onClick={() =>
              notify(
                '관심 가챠 소식을 가장 먼저',
                '입고 알림은 출시 예정 기능입니다. 이번 체험에서는 신청이나 실제 알림 발송이 이루어지지 않아요.',
              )
            }
          >
            <Icon name="bell" size={16} /> 입고 알림 신청
          </button>
        </aside>
        <section className="promo-feed">
          <div className="promo-section-heading">
            <div>
              <h2>
                {category === '전체'
                  ? '산리오 캐릭터즈 인기 컬렉션'
                  : category + ' 전체 리스트'}
              </h2>
              <p>
                {category === '전체'
                  ? '이번 주 위시리스트에 담고 싶은 귀여운 가챠'
                  : '좋아하는 카테고리의 가챠를 한눈에 찾아보세요'}
              </p>
            </div>
            {products.length > 4 && (
              <button
                className="promo-text-button"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? '접기' : '전체 보기'}
                <Icon name="chevron" size={16} />
              </button>
            )}
          </div>
          {products.length ? (
            <div className="promo-product-grid">
              {products
                .slice(0, showAll ? products.length : 4)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    navigate={navigate}
                    isLiked={likes.has(product.id)}
                    onLike={() => onLike(product.id)}
                  />
                ))}
            </div>
          ) : (
            <div className="promo-empty">
              <Icon name="box" size={32} />
              <h3>{category} 가챠도 곧 만나요</h3>
              <p>이번 체험에서는 산리오와 포켓몬 예시를 준비했어요.</p>
              <button
                className="promo-button is-outline"
                onClick={() => setCategory('전체')}
              >
                전체 가챠 보기
              </button>
            </div>
          )}
        </section>
        {category === '전체' && (
          <section className="promo-feed">
            <div className="promo-section-heading">
              <div>
                <h2>다음에 만나고 싶은 가챠</h2>
                <p>
                  입고 예정 콘텐츠는 이렇게 보여드릴 계획이에요 · 예시 데이터
                </p>
              </div>
              <button
                className="promo-text-button"
                onClick={() => {
                  setCategory('포켓몬');
                  setShowAll(true);
                }}
              >
                포켓몬 보기
                <Icon name="chevron" size={16} />
              </button>
            </div>
            <div className="promo-product-grid">
              {demoProducts.slice(10, 14).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  navigate={navigate}
                  isLiked={likes.has(product.id)}
                  onLike={() => onLike(product.id)}
                />
              ))}
            </div>
          </section>
        )}
        <section className="promo-preview-note">
          <Icon name="sparkle" />
          <div>
            <strong>당신의 가챠 생활이 조금 더 편해지도록</strong>
            <p>
              원하는 가챠 찾기부터 가까운 매장 탐색, 중복 가챠 교환까지. 어떤
              기능이 가장 기대되는지 현장 크루에게 알려주세요!
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
