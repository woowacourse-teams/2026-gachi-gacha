import { useState } from 'react';

import { demoProducts, demoStores, formatSamplePrice } from '../data/demoData';
import { DemoLink } from '../ui/DemoLink';
import { Icon } from '../ui/Icon';
import { IllustratedMap } from '../ui/IllustratedMap';

export function SearchPage({
  productId,
  navigate,
  notify,
}: {
  productId: number | null;
  navigate: (href: string) => void;
  notify: (title: string, message: string) => void;
}) {
  const product = demoProducts.find((item) => item.id === productId);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const matchingStores = product
    ? demoStores.filter((store) => product.sampleStoreIds.includes(store.id))
    : demoStores;
  const filteredStores = matchingStores.filter(
    (store) => !onlyOpen || store.sampleOpen,
  );
  const stores = reverse ? [...filteredStores].reverse() : filteredStores;
  const activeId = stores.some((store) => store.id === selectedId)
    ? selectedId
    : null;

  function selectStore(id: number) {
    setSelectedId(id);
    if (mobileView === 'map')
      document
        .getElementById('promo-store-' + id)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  if (productId !== null && !product)
    return (
      <main className="promo-container promo-empty">
        <h1>체험용 가챠를 찾을 수 없어요</h1>
        <DemoLink href="/demo" navigate={navigate} className="promo-button">
          홈으로 돌아가기
        </DemoLink>
      </main>
    );

  return (
    <main className="promo-search-page">
      <div
        className="promo-mobile-view-switch"
        role="group"
        aria-label="결과 보기 방식"
      >
        <button
          className={mobileView === 'list' ? 'is-active' : ''}
          onClick={() => setMobileView('list')}
        >
          매장 목록
        </button>
        <button
          className={mobileView === 'map' ? 'is-active' : ''}
          onClick={() => setMobileView('map')}
        >
          지도 보기
        </button>
      </div>
      <section
        className={
          'promo-store-panel' +
          (mobileView === 'map' ? ' promo-mobile-hidden' : '')
        }
        aria-label="보유 매장 예시 목록"
      >
        {product ? (
          <div className="promo-selected-product">
            <img src={product.image} alt="" />
            <div>
              <span>이 가챠를 보유한 매장 예시를 보고 있어요</span>
              <h1>{product.name}</h1>
              <p>{formatSamplePrice(product.samplePrice)} / 1회 · 가격 예시</p>
            </div>
            <button
              className="promo-button is-outline"
              onClick={() =>
                notify(
                  '입고 알림을 준비 중이에요',
                  '관심 가챠 입고 시 알림을 드릴 예정입니다. 이번 화면에서는 실제 재고 확인이나 알림 신청이 이루어지지 않습니다.',
                )
              }
            >
              <Icon name="bell" size={16} />
              <span>입고 알림</span>
            </button>
          </div>
        ) : (
          <div className="promo-map-intro">
            <h1>가까운 가챠 매장을 찾아보세요</h1>
            <p>
              상단 검색창에서 원하는 가챠를 고르면 보유 매장 예시가 표시됩니다.
            </p>
          </div>
        )}
        <div className="promo-store-toolbar">
          <p>
            홍대 주변 · 매장 예시 <strong>{stores.length}곳</strong>
          </p>
          <div>
            <button
              className={
                'promo-button is-outline' + (onlyOpen ? ' is-selected' : '')
              }
              aria-pressed={onlyOpen}
              onClick={() => setOnlyOpen((value) => !value)}
            >
              <Icon name="filter" size={16} />
              {onlyOpen ? '영업 중만' : '필터'}
            </button>
            <button
              className="promo-button is-outline"
              onClick={() => setReverse((value) => !value)}
            >
              <Icon name="sort" size={16} />
              {reverse ? '먼 순' : '가까운 순'}
            </button>
          </div>
        </div>
        <p className="promo-small-disclaimer">
          보유 여부·거리·영업 상태·가격은 실제 정보가 아닌 예시입니다.
        </p>
        <div className="promo-store-list">
          {stores.map((store) => (
            <article
              key={store.id}
              id={'promo-store-' + store.id}
              className={
                'promo-store-card' +
                (activeId === store.id ? ' is-selected' : '')
              }
            >
              <button
                className="promo-store-card-main"
                onClick={() => selectStore(store.id)}
                aria-label={store.name + ' 지도에서 선택'}
                aria-pressed={activeId === store.id}
              >
                <img src={store.image} alt="" loading="lazy" decoding="async" />
                <div className="promo-store-info">
                  <div className="promo-store-name">
                    <h2>{store.name}</h2>
                    <span
                      className={
                        'promo-status' + (!store.sampleOpen ? ' is-closed' : '')
                      }
                    >
                      {store.sampleOpen ? '영업 중' : '영업 종료'}
                    </span>
                  </div>
                  <p>
                    {store.address} · {store.sampleDistance}
                  </p>
                  <strong className="promo-owned">
                    <Icon name="box" size={17} />
                    {product
                      ? '선택한 가챠 보유 예시'
                      : '다양한 가챠를 만나보세요'}{' '}
                    · 전체 {store.sampleMachineCount}대
                  </strong>
                  <div className="promo-store-bottom">
                    <span>
                      {activeId === store.id
                        ? '지도에서 선택됨'
                        : '클릭하면 지도에서 확인'}
                    </span>
                    <strong>{store.samplePriceRange}</strong>
                  </div>
                </div>
              </button>
              <DemoLink
                href={'/demo/stores/' + store.id}
                navigate={navigate}
                className="promo-store-detail-link"
              >
                매장 상세 보기
                <Icon name="chevron" size={15} />
              </DemoLink>
            </article>
          ))}
        </div>
        {!stores.length && (
          <div className="promo-empty">
            <h2>조건에 맞는 매장 예시가 없어요</h2>
            <button
              className="promo-button is-outline"
              onClick={() => setOnlyOpen(false)}
            >
              필터 초기화
            </button>
          </div>
        )}
      </section>
      <section
        className={
          'promo-map-panel' +
          (mobileView === 'list' ? ' promo-mobile-hidden' : '')
        }
        aria-label="예시 지도"
      >
        <IllustratedMap
          stores={stores}
          selectedId={activeId}
          onSelect={selectStore}
          notify={notify}
        />
        {activeId !== null && (
          <div className="promo-map-selected">
            <strong>
              {stores.find((store) => store.id === activeId)?.name}
            </strong>
            <DemoLink href={'/demo/stores/' + activeId} navigate={navigate}>
              매장 상세 보기
              <Icon name="chevron" size={16} />
            </DemoLink>
          </div>
        )}
      </section>
    </main>
  );
}
