import { MyTradesSection } from '../components/MyTradesSection';
import {
  MyPageMobileSubPage,
  MyPageWebLayout,
  useIsMobileMyPage,
} from '../MyPageLayout';

export function MyTradesRoute() {
  const isMobile = useIsMobileMyPage();

  if (isMobile) {
    return (
      <MyPageMobileSubPage title="내 글" backTo="/mypage">
        <MyTradesSection variant="mobile" />
      </MyPageMobileSubPage>
    );
  }

  return (
    <MyPageWebLayout activeKey="trades">
      <MyTradesSection variant="web" />
    </MyPageWebLayout>
  );
}
