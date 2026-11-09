import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router';

import { breakpoint, color, focusRing, radius } from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';

const HOME_PATH = '/trade';

interface SupportPageLayoutProps {
  /** 모바일 상단 바 제목 */
  title: string;
  currentPath: string;
  children: ReactNode;
}

function canGoBack(): boolean {
  const state: unknown = window.history.state;

  return (
    typeof state === 'object' &&
    state !== null &&
    'idx' in state &&
    typeof state.idx === 'number' &&
    state.idx > 0
  );
}

/**
 * 고객 지원 문서 화면(업데이트 소식, 개인정보 처리방침) 공통 틀.
 * 웹은 헤더와 800px 본문, 모바일은 뒤로 가기·제목 상단 바를 쓴다.
 * 뒤로 가기는 이전 화면으로, 이전 화면이 없으면 홈으로 이동한다.
 */
export function SupportPageLayout({
  title,
  currentPath,
  children,
}: SupportPageLayoutProps) {
  const navigate = useNavigate();

  function goBack() {
    if (canGoBack()) {
      void navigate(-1);
      return;
    }

    void navigate(HOME_PATH);
  }

  return (
    <Page>
      <DesktopHeader>
        <AppHeader currentPath={currentPath} />
      </DesktopHeader>
      <MobileTopBar>
        <MobileBackButton type="button" aria-label="뒤로 가기" onClick={goBack}>
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
        </MobileBackButton>
        <MobileTitle>{title}</MobileTitle>
      </MobileTopBar>
      <Main>
        <Article>
          <DesktopBackButton type="button" onClick={goBack}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            뒤로 가기
          </DesktopBackButton>
          {children}
        </Article>
      </Main>
    </Page>
  );
}

const mobile = `@media (max-width: ${breakpoint.mobile})`;

const Page = styled.div`
  min-height: 100dvh;
  background: ${color.surface};
`;

const DesktopHeader = styled.div`
  ${mobile} {
    display: none;
  }
`;

const MobileTopBar = styled.div`
  display: none;

  ${mobile} {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    height: 48px;
    padding: env(safe-area-inset-top) 14px 0 8px;
    align-items: center;
    gap: 4px;
    background: ${color.surface};
  }
`;

const MobileBackButton = styled.button`
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${radius.circle};
  background: transparent;
  color: ${color.text};
  cursor: pointer;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const MobileTitle = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: 17px;
  font-weight: 700;
`;

const Main = styled.main`
  display: flex;
  padding: 40px 24px 72px;
  justify-content: center;

  ${mobile} {
    padding: 16px 20px 32px;
  }
`;

const Article = styled.div`
  display: flex;
  width: min(100%, 800px);
  min-width: 0;
  flex-direction: column;
  gap: 32px;

  ${mobile} {
    gap: 24px;
  }
`;

const DesktopBackButton = styled.button`
  display: inline-flex;
  width: fit-content;
  padding: 0;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: ${radius.small};
  background: transparent;
  color: ${color.textMuted};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  ${mobile} {
    display: none;
  }
`;
