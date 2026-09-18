import { useState } from 'react';

import type { DemoStore } from '../demoType';
import { Icon } from './Icon';

export function IllustratedMap({
  stores,
  selectedId,
  onSelect,
  notify,
}: {
  stores: readonly DemoStore[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  notify: (title: string, message: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="promo-map" aria-label="보유 매장 예시 지도">
      <div
        className="promo-map-canvas"
        style={{ transform: 'scale(' + zoom + ')' }}
      >
        <svg
          className="promo-map-roads"
          viewBox="0 0 800 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width="800" height="1000" fill="#ebe9e0" />
          <rect x="65" y="65" width="180" height="175" rx="65" fill="#d2e4c5" />
          <rect
            x="540"
            y="200"
            width="215"
            height="175"
            rx="65"
            fill="#d2e4c5"
          />
          <rect
            x="30"
            y="700"
            width="230"
            height="180"
            rx="90"
            fill="#d2e4c5"
          />
          <rect
            x="650"
            y="820"
            width="210"
            height="190"
            rx="80"
            fill="#d2e4c5"
          />
          <path d="M-10 970 820 820" stroke="#c3ddea" strokeWidth="105" />
          <g fill="#e0ded2">
            <rect x="290" y="80" width="150" height="125" rx="15" />
            <rect x="90" y="330" width="145" height="130" rx="15" />
            <rect x="540" y="530" width="190" height="100" rx="15" />
            <rect x="295" y="690" width="190" height="100" rx="15" />
          </g>
          <g stroke="#fff" strokeWidth="16" fill="none">
            <path d="M110-20 55 1000 M265-20 325 1000 M460-20 520 1000 M715-20 615 1000 M-20 285 820 330 M-20 475 820 440 M-20 610 820 590 M-20 790 820 850" />
          </g>
        </svg>
        <span className="promo-map-label" style={{ left: '12%', top: '18%' }}>
          연남동
        </span>
        <span className="promo-map-label" style={{ left: '63%', top: '17%' }}>
          동교동
        </span>
        <span className="promo-map-label" style={{ left: '14%', top: '72%' }}>
          합정동
        </span>
        <span className="promo-map-label" style={{ left: '74%', top: '83%' }}>
          상수동
        </span>
        <span className="promo-map-station">
          <i /> 홍대입구역
        </span>
        {stores.map((store) => (
          <button
            key={store.id}
            className={
              'promo-map-pin' + (store.id === selectedId ? ' is-selected' : '')
            }
            style={{ left: store.pin.x + '%', top: store.pin.y + '%' }}
            aria-label={store.name + ' 지도에서 선택'}
            aria-pressed={store.id === selectedId}
            onClick={() => onSelect(store.id)}
          >
            {store.name}
            <span>{store.samplePriceRange.split(' ~ ')[0]}</span>
          </button>
        ))}
      </div>
      <button
        className="promo-map-research"
        onClick={() =>
          notify(
            '이 지역에서 다시 찾아요',
            '실제 지도에서는 화면을 이동한 뒤 이 버튼을 눌러 주변 보유 매장을 다시 찾을 수 있도록 개발 중입니다. 현재 지도는 위치 연동 없는 체험용 도식입니다.',
          )
        }
      >
        <Icon name="refresh" size={16} /> 이 지역에서 재검색
      </button>
      <div className="promo-map-controls">
        <button
          className="promo-icon-button"
          aria-label="예시 지도 확대"
          disabled={zoom >= 1.6}
          onClick={() => setZoom((value) => Math.min(1.6, value + 0.2))}
        >
          <Icon name="plus" />
        </button>
        <button
          className="promo-icon-button"
          aria-label="예시 지도 축소"
          disabled={zoom <= 1}
          onClick={() => setZoom((value) => Math.max(1, value - 0.2))}
        >
          <Icon name="minus" />
        </button>
        <button
          className="promo-icon-button"
          aria-label="예시 지도 원래 배율"
          onClick={() => setZoom(1)}
        >
          <Icon name="target" />
        </button>
      </div>
      <span className="promo-map-disclaimer">
        체험용 지도 도식 · 실제 위치·재고 연동 예정
      </span>
    </div>
  );
}
