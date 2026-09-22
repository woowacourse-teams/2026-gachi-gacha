import type { DemoProduct } from '../demoType';
import { DemoLink } from './DemoLink';
import { Icon, Logo } from './Icon';
import { SearchBox } from './SearchBox';

export function Header({
  page,
  navigate,
  onProductSelect,
  notify,
}: {
  page: string;
  navigate: (href: string) => void;
  onProductSelect: (product: DemoProduct) => void;
  notify: (title: string, message: string) => void;
}) {
  return (
    <>
      <div className="promo-demo-banner">
        <span className="promo-demo-label">PREVIEW</span>
        <span>
          새로운 가치가챠를 미리 체험해 보세요.{' '}
          <span className="promo-banner-extra">
            가격·재고·교환 게시글은 예시입니다.
          </span>
        </span>
      </div>
      <header className="promo-header">
        <DemoLink href="/demo" navigate={navigate} className="promo-brand">
          <Logo />
          <span>GachiGacha</span>
        </DemoLink>
        {page !== 'home' && (
          <div className="promo-header-search">
            <SearchBox onSelect={onProductSelect} />
          </div>
        )}
        <nav className="promo-navigation" aria-label="주 메뉴">
          <DemoLink
            href="/demo"
            navigate={navigate}
            className={page !== 'market' ? 'is-active' : ''}
            aria-current={page === 'home' ? 'page' : undefined}
          >
            찾기
          </DemoLink>
          <DemoLink
            href="/demo/search"
            navigate={navigate}
            aria-current={page === 'search' ? 'page' : undefined}
          >
            지도
          </DemoLink>
          <DemoLink
            href="/demo/market"
            navigate={navigate}
            className={page === 'market' ? 'is-active' : ''}
            aria-current={page === 'market' ? 'page' : undefined}
          >
            중고거래
          </DemoLink>
        </nav>
        <div className="promo-header-actions">
          <button
            className="promo-icon-button"
            aria-label="채팅 준비 안내"
            onClick={() =>
              notify(
                '마음에 드는 가챠, 함께 교환해요',
                '채팅으로 교환 약속을 잡는 기능을 준비 중이에요. 이 체험 화면에서는 실제 메시지가 전송되지 않습니다.',
              )
            }
          >
            <Icon name="chat" />
          </button>
          <button
            className="promo-icon-button"
            aria-label="입고 알림 준비 안내"
            onClick={() =>
              notify(
                '놓치고 싶지 않은 가챠가 있나요?',
                '관심 가챠가 근처 매장에 입고되면 알려드리는 기능을 준비하고 있어요. 지금은 실제 알림 신청을 받지 않습니다.',
              )
            }
          >
            <Icon name="bell" />
          </button>
          <button
            className="promo-icon-button"
            aria-label="로그인 준비 안내"
            onClick={() =>
              notify(
                '검색은 로그인 없이 자유롭게',
                '가챠와 매장은 누구나 찾아볼 수 있어요. 향후 교환 글 작성과 채팅을 이용할 때는 로그인이 필요합니다.',
              )
            }
          >
            <Icon name="user" />
          </button>
        </div>
        {page !== 'home' && (
          <div className="promo-mobile-search">
            <SearchBox onSelect={onProductSelect} />
          </div>
        )}
      </header>
    </>
  );
}
