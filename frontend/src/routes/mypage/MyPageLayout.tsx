import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import { isEventApplicationOpen } from '@/features/eventApplication/eventApplicationConfig';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { breakpoint, color, focusRing, radius } from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import { MyPageMenu, type MyPageMenuKey } from './components/MyPageMenu';
import { useMyPageAccount } from './useMyPageAccount';

export const MOBILE_MEDIA_QUERY = `(max-width: ${breakpoint.mobile})`;

export function useIsMobileMyPage(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}

interface MyPageWebLayoutProps {
  activeKey: MyPageMenuKey;
  children: ReactNode;
}

/** 웹: 왼쪽 메뉴를 유지한 채 오른쪽 내용만 바꾼다. */
export function MyPageWebLayout({ activeKey, children }: MyPageWebLayoutProps) {
  const account = useMyPageAccount();

  if (!account.member) {
    return <PageLoadingFallback label="회원 정보를 확인하고 있어요." />;
  }

  return (
    <Page>
      <AppHeader currentPath="/mypage" />
      <WebBody>
        <SideColumn>
          <MyPageMenu
            variant="side"
            member={account.member}
            activeKey={activeKey}
            showEventApplication={isEventApplicationOpen()}
            onEditProfile={account.openProfileEdit}
            onLogout={account.requestLogout}
            onDeleteAccount={account.requestAccountDeletion}
          />
        </SideColumn>
        <ContentColumn>
          {account.profileNotice && (
            <Notice role="status">{account.profileNotice}</Notice>
          )}
          {children}
        </ContentColumn>
      </WebBody>
      {account.dialogs}
    </Page>
  );
}

/** 모바일 마이 탭: 프로필과 메뉴 목록 */
export function MyPageMobileMenu() {
  const account = useMyPageAccount();

  if (!account.member) {
    return <PageLoadingFallback label="회원 정보를 확인하고 있어요." />;
  }

  return (
    <Page data-mobile-tabs>
      <AppHeader
        currentPath="/mypage"
        mobileVariant="title"
        mobileTitle="마이"
        showMobileTabs
      />
      <main>
        {account.profileNotice && (
          <Notice role="status" data-mobile>
            {account.profileNotice}
          </Notice>
        )}
        <MyPageMenu
          variant="list"
          member={account.member}
          showEventApplication={isEventApplicationOpen()}
          onEditProfile={account.openProfileEdit}
          onLogout={account.requestLogout}
          onDeleteAccount={account.requestAccountDeletion}
        />
      </main>
      {account.dialogs}
    </Page>
  );
}

interface MobileSubPageProps {
  title: string;
  backTo: string;
  children: ReactNode;
}

/** 모바일 마이 하위 화면: 뒤로 가기와 제목만 있는 상단 바 */
export function MyPageMobileSubPage({
  title,
  backTo,
  children,
}: MobileSubPageProps) {
  return (
    <Page>
      <TopBar>
        <BackLink to={backTo} aria-label="마이로 돌아가기">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </BackLink>
        <TopBarTitle>{title}</TopBarTitle>
      </TopBar>
      <main>{children}</main>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: ${color.surface};

  &[data-mobile-tabs] {
    padding-bottom: calc(56px + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }
`;

const WebBody = styled.div`
  display: grid;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 120px 64px;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: start;
  gap: 48px;
  box-sizing: border-box;

  @media (max-width: 1280px) {
    padding: 32px 40px 64px;
    gap: 40px;
  }

  @media (max-width: 1003px) {
    padding: 24px 24px 48px;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 32px;
  }
`;

const SideColumn = styled.aside`
  position: sticky;
  top: 96px;
  min-width: 0;
`;

const ContentColumn = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`;

const Notice = styled.p`
  margin: 0;
  padding: 12px 16px;
  border-radius: ${radius.control};
  background: #f3f1ef;
  color: ${color.text};
  font-size: 14px;

  &[data-mobile] {
    margin: 0 24px 12px;
  }
`;

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  height: 48px;
  padding: env(safe-area-inset-top) 14px 0 8px;
  align-items: center;
  gap: 4px;
  background: ${color.surface};
`;

const BackLink = styled(Link)`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: ${radius.circle};
  color: ${color.text};

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const TopBarTitle = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: 17px;
  font-weight: 700;
`;
