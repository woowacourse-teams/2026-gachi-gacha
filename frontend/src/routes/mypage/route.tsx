import { MyTradesSection } from './components/MyTradesSection';
import {
  MyPageMobileMenu,
  MyPageWebLayout,
  useIsMobileMyPage,
} from './MyPageLayout';

/** 웹은 왼쪽 메뉴와 내 글, 모바일은 마이 탭 메뉴 목록을 보여준다. */
export function MyPageRoute() {
  const isMobile = useIsMobileMyPage();

  if (isMobile) {
    return <MyPageMobileMenu />;
  }

  return (
    <MyPageWebLayout activeKey="trades">
      <MyTradesSection variant="web" />
    </MyPageWebLayout>
  );
}
