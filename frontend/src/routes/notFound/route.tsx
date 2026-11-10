import styled from '@emotion/styled';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { normalizeAuthReturnPath } from '@/features/auth/authReturnPath';
import { breakpoint, color, focusRing, radius } from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';
import { ErrorState } from '@/shared/ui/ErrorState';

const HOME_PATH = '/trade';

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

/** 없는 주소, 잘못된 글·매장 번호로 들어왔을 때 보여주는 화면 (404) */
export function NotFoundRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const safePath = normalizeAuthReturnPath(currentPath);

  // 공유 링크 등에 섞여 들어온 인증 값은 주소창에 남기지 않는다.
  if (
    safePath !== currentPath &&
    new URL(safePath, window.location.origin).pathname === location.pathname
  ) {
    return <Navigate replace to={safePath} />;
  }

  return (
    <Page>
      <DesktopHeader>
        <AppHeader currentPath={location.pathname} />
      </DesktopHeader>
      <MobileTopBar>
        <BackButton
          type="button"
          aria-label="뒤로 가기"
          onClick={() => {
            if (canGoBack()) {
              void navigate(-1);
              return;
            }

            void navigate(HOME_PATH);
          }}
        >
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
        </BackButton>
      </MobileTopBar>
      <Main>
        <ErrorState
          icon="question"
          headingLevel={1}
          title="페이지를 찾을 수 없어요"
          description="주소가 바뀌었거나 삭제된 페이지예요."
          action={{ label: '홈으로', to: HOME_PATH }}
        />
      </Main>
    </Page>
  );
}

const mobile = `@media (max-width: ${breakpoint.mobile})`;

const Page = styled.div`
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
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
    display: flex;
    height: 48px;
    padding: env(safe-area-inset-top) 14px 0 8px;
    align-items: center;
  }
`;

const BackButton = styled.button`
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

const Main = styled.main`
  display: flex;
  min-height: 560px;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 64px 0;

  ${mobile} {
    min-height: 0;
    padding: 0 0 96px;
  }
`;
