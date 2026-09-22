import { useState } from 'react';

import {
  demoListings,
  demoProducts,
  formatSamplePrice,
  searchDemoProducts,
} from '../data/demoData';
import { Icon } from '../ui/Icon';

const categoryOptions = ['전체', '산리오', '포켓몬', '키링', '피규어'];

export function MarketPage({
  notify,
}: {
  notify: (title: string, message: string) => void;
}) {
  const [category, setCategory] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [onlyToday, setOnlyToday] = useState(false);
  const [reverse, setReverse] = useState(false);
  const matchingIds = new Set(
    searchDemoProducts(keyword).map((product) => product.id),
  );
  const filtered = demoListings.filter((listing) => {
    const product = demoProducts.find((item) => item.id === listing.productId);
    return (
      product &&
      (category === '전체' || product.categories.includes(category)) &&
      (!keyword.trim() ||
        listing.title.includes(keyword.trim()) ||
        matchingIds.has(product.id)) &&
      (!onlyToday || listing.sampleTime.startsWith('오늘'))
    );
  });
  const listings = reverse ? [...filtered].reverse() : filtered;
  return (
    <main className="promo-container promo-market-page">
      <div className="promo-market-heading">
        <div>
          <h1>
            홍대입구 <span className="promo-heading-chevron">⌄</span>
          </h1>
          <p>우리 동네에서 바로 교환 가능한 가챠를 찾아보세요</p>
        </div>
        <span className="promo-inline-label">교환 서비스 출시 예정</span>
      </div>
      <div className="promo-market-tools">
        <div
          className="promo-market-chips"
          role="group"
          aria-label="교환 게시글 예시 카테고리"
        >
          {categoryOptions.map((label) => (
            <button
              key={label}
              className={category === label ? 'is-active' : ''}
              aria-pressed={category === label}
              onClick={() => setCategory(label)}
            >
              {label}
            </button>
          ))}
          <button
            className={onlyToday ? 'is-active' : ''}
            aria-pressed={onlyToday}
            onClick={() => setOnlyToday((value) => !value)}
          >
            <Icon name="clock" size={16} />
            오늘 교환
          </button>
        </div>
        <label className="promo-market-search">
          <Icon name="search" size={17} />
          <input
            aria-label="교환 게시글 예시 검색"
            placeholder="이름 · 카테고리로 찾아보세요"
            value={keyword}
            maxLength={100}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
      </div>
      <div className="promo-market-layout">
        <section>
          <div className="promo-section-heading">
            <h2>홍대입구 근처 교환 글</h2>
            <button
              className="promo-text-button"
              onClick={() => setReverse((value) => !value)}
            >
              {reverse ? '등록순' : '최신순'}
              <Icon name="sort" size={16} />
            </button>
          </div>
          <p className="promo-small-disclaimer">
            실제 거래가 아닌 예시 게시글입니다. 구매·교환 요청은 전송되지
            않습니다.
          </p>
          <div className="promo-listings">
            {listings.map((listing) => {
              const product = demoProducts.find(
                (item) => item.id === listing.productId,
              );
              if (!product) return null;
              return (
                <button
                  key={listing.id}
                  className="promo-listing"
                  onClick={() =>
                    notify(
                      listing.title,
                      '교환 글 상세와 채팅으로 약속을 잡는 기능을 준비 중이에요. 이 예시 게시글은 실제 사용자가 올린 글이 아니며 거래 요청은 전송되지 않습니다.',
                    )
                  }
                >
                  <img
                    src={product.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <h3>{listing.title}</h3>
                    <p>
                      {listing.neighborhood} · {listing.sampleTime}
                    </p>
                    <strong>
                      {formatSamplePrice(listing.samplePrice)}{' '}
                      <span>가격 예시</span>
                    </strong>
                    <p className="promo-listing-tags">
                      {product.categories.slice(0, 3).join(' · ')}
                    </p>
                  </div>
                  <Icon name="chevron" size={18} />
                </button>
              );
            })}
          </div>
          {!listings.length && (
            <div className="promo-empty">
              <Icon name="search" size={32} />
              <h3>조건에 맞는 예시가 없어요</h3>
              <button
                className="promo-button is-outline"
                onClick={() => {
                  setKeyword('');
                  setCategory('전체');
                  setOnlyToday(false);
                }}
              >
                검색·필터 초기화
              </button>
            </div>
          )}
        </section>
        <aside className="promo-market-sidebar">
          <div className="promo-market-cta">
            <h2>교환할 캡슐이 있나요?</h2>
            <p>
              사진 한 장과 만날 동네만 정하면
              <br />
              근처 컬렉터에게 바로 보여요.
            </p>
            <button
              className="promo-button"
              onClick={() =>
                notify(
                  '중복 가챠도 새로운 만남으로',
                  '정식 서비스에서는 로그인 후 사진과 교환 조건을 등록할 수 있어요. 이번 체험에서는 게시글을 작성하거나 사진을 업로드하지 않습니다.',
                )
              }
            >
              <Icon name="camera" size={18} />
              사진으로 등록
            </button>
          </div>
          <div className="promo-market-spots">
            <h2>교환 장소 예시</h2>
            <p>
              홍대입구역 8번 출구
              <Icon name="pin" size={16} />
            </p>
            <p>
              연트럴파크 입구
              <Icon name="pin" size={16} />
            </p>
            <p>
              합정 메세나폴리스
              <Icon name="pin" size={16} />
            </p>
          </div>
          <div className="promo-market-manners">
            <h2>
              <Icon name="check" />
              동네 교환 매너
            </h2>
            <p>
              공개된 장소에서 만나고, 캡슐 상태와 구성품을 사진으로 먼저 확인해
              주세요.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
