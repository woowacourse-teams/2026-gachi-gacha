import { useState } from 'react';

import { demoProducts, demoStores } from '../data/demoData';
import { DemoLink } from '../ui/DemoLink';
import { Icon } from '../ui/Icon';
import { ImageViewer } from '../ui/ImageViewer';
import { ProductCard } from '../ui/ProductCard';

export function StorePage({
  storeId,
  navigate,
  likes,
  onLike,
  notify,
}: {
  storeId: number | null;
  navigate: (href: string) => void;
  likes: ReadonlySet<number>;
  onLike: (id: number) => void;
  notify: (title: string, message: string) => void;
}) {
  const store = demoStores.find((item) => item.id === storeId);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  if (!store)
    return (
      <main className="promo-container promo-empty">
        <h1>체험용 매장을 찾을 수 없어요</h1>
        <DemoLink
          href="/demo/search"
          navigate={navigate}
          className="promo-button"
        >
          매장 목록으로
        </DemoLink>
      </main>
    );
  const products = demoProducts.filter((product) =>
    product.sampleStoreIds.includes(store.id),
  );
  return (
    <main className="promo-container promo-store-page">
      <DemoLink
        href="/demo/search"
        navigate={navigate}
        className="promo-breadcrumb"
      >
        찾기 / 매장 / {store.name}
      </DemoLink>
      <div className="promo-store-page-heading">
        <div>
          <div className="promo-store-name">
            <h1>{store.name}</h1>
            <span
              className={
                'promo-status' + (!store.sampleOpen ? ' is-closed' : '')
              }
            >
              {store.sampleOpen ? '영업 중' : '영업 종료'} · 예시
            </span>
          </div>
          <p>{store.address}</p>
        </div>
        <div className="promo-store-page-actions">
          <button
            className="promo-text-button"
            onClick={() =>
              notify(
                '친구와 함께 가챠 탐방',
                '정식 서비스에서는 매장 정보를 공유할 수 있도록 준비할 예정이에요. 현재는 체험용 매장 화면입니다.',
              )
            }
          >
            <Icon name="share" size={17} />
            공유
          </button>
          <button
            className="promo-text-button"
            onClick={() =>
              notify(
                '좋아하는 매장을 모아두세요',
                '매장 저장 기능을 준비하고 있어요. 이 화면에서는 실제 계정에 매장이 저장되지 않습니다.',
              )
            }
          >
            <Icon name="heart" size={17} />
            저장
          </button>
        </div>
      </div>
      <div className="promo-store-gallery">
        {store.gallery.map((image, index) => (
          <button
            key={image + index}
            onClick={() => setViewImage(image)}
            aria-label={store.name + ' 예시 사진 ' + (index + 1) + ' 확대'}
          >
            <img
              src={image}
              alt={store.name + ' 체험용 사진 ' + (index + 1)}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </button>
        ))}
      </div>
      <p className="promo-small-disclaimer">
        체험용 예시 매장입니다. 아래 보유 상품·영업시간·가격은 실제 정보가
        아닙니다.
      </p>
      <div className="promo-store-facts">
        <div>
          <Icon name="box" />
          <strong>가챠 {store.sampleMachineCount}대 운영</strong>
        </div>
        <div>
          <Icon name="sparkle" />
          <strong>다양한 캐릭터 카테고리</strong>
        </div>
        <div>
          <Icon name="grid" />
          <strong>카드 · 교통카드 결제</strong>
        </div>
        <div>
          <Icon name="pin" />
          <strong>홍대 주변에서 만나요</strong>
        </div>
      </div>
      <section className="promo-detail-section">
        <h2>매장 소개</h2>
        <p>
          귀여운 캐릭터부터 나만 알고 싶은 작은 소품까지, 취향에 꼭 맞는 가챠를
          찾아보세요. 매장에 방문하기 전 보유한 가챠와 운영 정보를 확인할 수
          있도록 준비하고 있어요.
        </p>
        <p className="promo-muted">
          이번 화면은 실제 매장이 아닌 서비스 이용 흐름을 보여드리는 예시입니다.
        </p>
      </section>
      <section className="promo-detail-section">
        <h2>
          가격 안내 <span className="promo-inline-label">예시</span>
        </h2>
        <div className="promo-price-row">
          <div>
            <strong>₩3,000</strong>
            <p>키링 · 미니 피규어</p>
          </div>
          <span>소소한 즐거움</span>
        </div>
        <div className="promo-price-row">
          <div>
            <strong>₩4,000 ~ ₩5,000</strong>
            <p>스탠드 피규어 · 마스코트</p>
          </div>
          <span>취향을 담은 한 캡슐</span>
        </div>
        <div className="promo-price-row">
          <div>
            <strong>₩6,000 이상</strong>
            <p>프리미엄 · 봉제인형</p>
          </div>
          <span>특별한 컬렉션</span>
        </div>
      </section>
      <section className="promo-detail-section">
        <div className="promo-section-heading">
          <h2>이 매장의 가챠 예시 {products.length}종</h2>
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
        <div className="promo-product-grid">
          {products.slice(0, showAll ? products.length : 4).map((product) => (
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
      <div className="promo-store-info-grid">
        <section>
          <h2>
            영업시간 <span className="promo-inline-label">예시</span>
          </h2>
          <dl>
            <div>
              <dt>월 – 목</dt>
              <dd>11:00 – 21:00</dd>
            </div>
            <div>
              <dt>금 – 토</dt>
              <dd>11:00 – 22:30</dd>
            </div>
            <div>
              <dt>일요일</dt>
              <dd>12:00 – 20:00</dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>매장 정보</h2>
          <p>
            <Icon name="pin" size={16} />
            {store.address}
          </p>
          <p>
            <Icon name="clock" size={16} />
            방문 전 최신 정보를 확인해 주세요.
          </p>
          <p>
            <Icon name="bell" size={16} />
            매장 정보 제보 기능 준비 중
          </p>
        </section>
      </div>
      <DemoLink
        href="/demo/search"
        navigate={navigate}
        className="promo-button is-outline promo-back-link"
      >
        다른 매장도 둘러보기
        <Icon name="arrow" size={16} />
      </DemoLink>
      {viewImage && (
        <ImageViewer
          src={viewImage}
          title={store.name}
          onClose={() => setViewImage(null)}
        />
      )}
    </main>
  );
}
