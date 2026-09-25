import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import {
  AccountCard,
  Heading,
  LogoutButton,
  Main,
  MemberLocation,
  MemberName,
  Page,
  PreparationCard,
  PreparationDescription,
  PreparationTitle,
  ProfileFallback,
  ProfileImage,
} from './route.styles';

function openGachaSearchResults(gachaId: number) {
  window.location.assign(createGachaSearchResultsUrl(gachaId));
}

export function MyPageRoute() {
  const { member, logout } = useAuthSession();

  if (!member) {
    return <PageLoadingFallback label="회원 정보를 확인하고 있어요." />;
  }

  function handleLogout() {
    logout();
    window.location.replace('/search');
  }

  return (
    <Page>
      <AppHeader
        currentPath="/mypage"
        search={<GachaSearchBar onSelect={openGachaSearchResults} />}
      />
      <Main>
        <Heading>마이페이지</Heading>
        <AccountCard>
          {member.profileImageUrl ? (
            <ProfileImage src={member.profileImageUrl} alt="프로필" />
          ) : (
            <ProfileFallback aria-hidden="true">
              {member.nickname?.trim().slice(0, 1) || 'G'}
            </ProfileFallback>
          )}
          <div>
            <MemberName>{member.nickname || '가치가챠 사용자'}</MemberName>
            <MemberLocation>
              {member.desireTradeLocation || '선호 거래 지역 미설정'}
            </MemberLocation>
          </div>
          <LogoutButton type="button" onClick={handleLogout}>
            로그아웃
          </LogoutButton>
        </AccountCard>
        <PreparationCard>
          <PreparationTitle>내 활동을 준비하고 있어요</PreparationTitle>
          <PreparationDescription>
            관심 가챠와 매장, 교환 글과 채팅을 한곳에서 확인하는 기능을 다음
            단계에서 연결할게요.
          </PreparationDescription>
        </PreparationCard>
      </Main>
    </Page>
  );
}
