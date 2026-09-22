import { useEffect, useState } from 'react';
import { Global } from '@emotion/react';

import { demoStyles } from './demoStyles';
import type { DemoProduct } from './demoType';
import { useDemoNavigation } from './hooks/useDemoNavigation';
import { HomePage } from './pages/HomePage';
import { MarketPage } from './pages/MarketPage';
import { SearchPage } from './pages/SearchPage';
import { StorePage } from './pages/StorePage';
import { DemoLink } from './ui/DemoLink';
import { Header } from './ui/Header';
import { Logo } from './ui/Icon';
import { InfoDialog } from './ui/InfoDialog';

export default function PromoApp() {
  const { route, navigate } = useDemoNavigation();
  const [likes, setLikes] = useState<ReadonlySet<number>>(() => new Set());
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const pageTitles = {
    home: '가치가챠 미리보기',
    search: '가챠 보유 매장 찾기',
    store: '매장 상세 미리보기',
    market: '동네 가챠 교환',
    'not-found': '페이지를 찾을 수 없어요',
  };
  const title = pageTitles[route.page];
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title + ' | 체험용 데모';
    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  function notify(title: string, message: string) {
    setNotice({ title, message });
  }
  function onLike(id: number) {
    setLikes((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectProduct(product: DemoProduct) {
    navigate('/demo/search?gachaId=' + product.id);
  }

  return (
    <div className="promo">
      <Global styles={demoStyles} />
      <a className="promo-skip-link" href="#promo-content">
        본문으로 바로가기
      </a>
      <Header
        page={route.page}
        navigate={navigate}
        onProductSelect={selectProduct}
        notify={notify}
      />
      <div id="promo-content" tabIndex={-1}>
        {route.page === 'home' && (
          <HomePage
            navigate={navigate}
            onProductSelect={selectProduct}
            likes={likes}
            onLike={onLike}
            notify={notify}
          />
        )}
        {route.page === 'search' && (
          <SearchPage
            key={route.productId ?? 'map'}
            productId={route.productId}
            navigate={navigate}
            notify={notify}
          />
        )}
        {route.page === 'store' && (
          <StorePage
            key={route.storeId}
            storeId={route.storeId}
            navigate={navigate}
            likes={likes}
            onLike={onLike}
            notify={notify}
          />
        )}
        {route.page === 'market' && <MarketPage notify={notify} />}
        {route.page === 'not-found' && (
          <main className="promo-container promo-empty">
            <h1>이 페이지는 준비되지 않았어요</h1>
            <DemoLink href="/demo" navigate={navigate} className="promo-button">
              홈으로 돌아가기
            </DemoLink>
          </main>
        )}
      </div>
      <footer className="promo-footer">
        <div>
          <DemoLink href="/demo" navigate={navigate} className="promo-brand">
            <Logo />
            <span>GachiGacha</span>
          </DemoLink>
          <p>가까운 곳에서 발견하는 작은 행복.</p>
        </div>
        <p>
          개발 중인 체험 화면 · 데이터와 기능은 정식 서비스와 다를 수 있습니다.
        </p>
        <button
          className="promo-text-button"
          onClick={() =>
            notify(
              '어떤 기능이 가장 기대되나요?',
              '현장 크루에게 기대되는 기능과 불편한 점을 편하게 말씀해 주세요. 별도 의견 입력·전송 기능은 준비 중입니다.',
            )
          }
        >
          의견 들려주기
        </button>
      </footer>
      {notice && (
        <InfoDialog
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}
    </div>
  );
}
