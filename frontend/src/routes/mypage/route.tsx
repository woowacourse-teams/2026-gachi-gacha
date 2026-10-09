import { useState } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { TradeDeleteDialog } from '@/domains/trade/components/TradeDeleteDialog';
import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import type { TradeSummary } from '@/domains/trade/tradeSummaryType';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  assignBrowserLocation,
  replaceBrowserLocation,
} from '@/shared/browser/browserNavigation';
import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import { AccountDeletionDialog } from './components/AccountDeletionDialog';
import { MyPageIcon } from './components/MyPageIcon';
import { ProfileEditDialog } from './components/ProfileEditDialog';
import {
  AccountMenu,
  AccountMenuCopy,
  AccountMenuDescription,
  AccountMenuIcon,
  AccountMenuLabel,
  AccountMenuLink,
  Card,
  CardHeader,
  CardLink,
  CardTitle,
  Content,
  Dashboard,
  DeleteAccountMenuButton,
  EmptyIcon,
  Heading,
  InterestBody,
  InterestGrid,
  LogoutMenuButton,
  Main,
  MemberDescription,
  MemberName,
  MemberRealName,
  Page,
  PageHeader,
  PageNotice,
  PreparationBadge,
  ProfileCard,
  ProfileDetail,
  ProfileDetailButton,
  ProfileDetailCopy,
  ProfileDetailIcon,
  ProfileDetailLabel,
  ProfileDetailValue,
  ProfileDetails,
  ProfileEditButton,
  ProfileFallback,
  ProfileIdentity,
  ProfileImage,
  ProfileNameCopy,
  RetryButton,
  Sidebar,
  StateDescription,
  StatePanel,
  StateTitle,
  Subheading,
  SummaryCard,
  SummaryDescription,
  SummaryGrid,
  SummaryIcon,
  SummaryLabel,
  SummaryTop,
  SummaryValue,
  TradeCopy,
  TradeDeleteButton,
  TradeEditLink,
  TradeItem,
  TradeList,
  TradeMeta,
  TradeSide,
  TradeThumbnail,
  TradeTitle,
} from './route.styles';
import { useMyPageTrades } from './useMyPageTrades';

const tradeDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
});

function openGachaSearchResults(gachaId: number) {
  assignBrowserLocation(createGachaSearchResultsUrl(gachaId));
}

function formatTradeDate(createdAt: string): string {
  const date = new Date(createdAt);

  return Number.isNaN(date.getTime())
    ? '등록일 확인 중'
    : `${tradeDateFormatter.format(date)} 등록`;
}

function getTradeMeta(trade: TradeSummary): string {
  const categoryLabel = trade.categories.join(' · ') || '카테고리 미설정';
  const placeLabel =
    trade.tradePlace?.name || trade.tradePlace?.address || '교환 장소 협의';

  return `${categoryLabel} · ${placeLabel} · ${formatTradeDate(trade.createdAt)}`;
}

export function MyPageRoute() {
  const { member, deleteAccount, logout, updateProfile } = useAuthSession();
  const {
    recentTrades,
    totalTradeCount,
    inProgressCount,
    status: tradeStatus,
    errorMessage,
    retry,
  } = useMyPageTrades();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDeletionDialogOpen, setIsDeletionDialogOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TradeSummary | null>(null);

  if (!member) {
    return <PageLoadingFallback label="회원 정보를 확인하고 있어요." />;
  }

  const summaryValue = (value: number) => {
    if (tradeStatus === 'loading') {
      return '…';
    }

    return tradeStatus === 'error' ? '—' : String(value);
  };

  function handleLogout() {
    captureAnalyticsEvent('account_menu_selected', {
      target: 'logout',
      source: 'mypage',
    });
    logout();
    replaceBrowserLocation('/trade');
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount();
      captureAnalyticsEvent('account_deletion_completed', {
        outcome: 'success',
      });
      replaceBrowserLocation('/trade');
    } catch (error) {
      captureAnalyticsEvent('account_deletion_completed', {
        outcome: 'failure',
      });
      throw error;
    }
  }

  function openProfileDialog() {
    captureAnalyticsEvent('profile_edit_started', {});
    setIsProfileDialogOpen(true);
  }

  return (
    <Page>
      <AppHeader
        currentPath="/mypage"
        search={<GachaSearchBar onSelect={openGachaSearchResults} />}
      />

      <Main>
        <PageHeader>
          <Heading>마이페이지</Heading>
          <Subheading>
            내 교환 활동과 관심 가챠·매장을 한곳에서 확인해요.
          </Subheading>
        </PageHeader>

        {profileNotice && (
          <PageNotice role="status">{profileNotice}</PageNotice>
        )}

        <Dashboard>
          <Sidebar>
            <ProfileCard data-private>
              <ProfileIdentity>
                {member.profileImageUrl ? (
                  <ProfileImage
                    src={member.profileImageUrl}
                    alt="프로필"
                    data-private-media
                  />
                ) : (
                  <ProfileFallback aria-hidden="true">
                    {member.nickname?.trim().slice(0, 1) || 'G'}
                  </ProfileFallback>
                )}
                <ProfileNameCopy>
                  <MemberName>
                    {member.nickname || '가치가챠 사용자'}
                  </MemberName>
                  {member.name?.trim() ? (
                    <MemberRealName>{member.name}</MemberRealName>
                  ) : (
                    <MemberDescription>
                      로그인한 계정의 활동을 관리해요
                    </MemberDescription>
                  )}
                </ProfileNameCopy>
              </ProfileIdentity>

              <ProfileEditButton type="button" onClick={openProfileDialog}>
                <MyPageIcon name="edit" size={18} />
                프로필 수정
              </ProfileEditButton>

              <ProfileDetails>
                <ProfileDetailButton type="button" onClick={openProfileDialog}>
                  <ProfileDetailIcon>
                    <MyPageIcon name="location" size={20} />
                  </ProfileDetailIcon>
                  <ProfileDetailCopy>
                    <ProfileDetailLabel>선호 거래 지역</ProfileDetailLabel>
                    <ProfileDetailValue>
                      {member.desireTradeLocation || '아직 설정하지 않았어요'}
                    </ProfileDetailValue>
                  </ProfileDetailCopy>
                  <MyPageIcon name="chevron" size={18} />
                </ProfileDetailButton>
                <ProfileDetail
                  href="/notifications"
                  onClick={() =>
                    captureAnalyticsEvent('navigation_selected', {
                      destination: 'notifications',
                      source: 'mypage',
                      is_authenticated: true,
                    })
                  }
                >
                  <ProfileDetailIcon>
                    <MyPageIcon name="bell" size={20} />
                  </ProfileDetailIcon>
                  <ProfileDetailCopy>
                    <ProfileDetailLabel>알림</ProfileDetailLabel>
                    <ProfileDetailValue>
                      교환과 관심 가챠 알림 준비 중
                    </ProfileDetailValue>
                  </ProfileDetailCopy>
                  <MyPageIcon name="chevron" size={18} />
                </ProfileDetail>
              </ProfileDetails>
            </ProfileCard>
          </Sidebar>

          <Content>
            <SummaryGrid aria-label="내 활동 요약">
              <SummaryCard>
                <SummaryTop>
                  <SummaryLabel>올린 교환글</SummaryLabel>
                  <SummaryIcon>
                    <MyPageIcon name="exchange" />
                  </SummaryIcon>
                </SummaryTop>
                <SummaryValue>{summaryValue(totalTradeCount)}</SummaryValue>
                <SummaryDescription>내가 등록한 전체 글</SummaryDescription>
              </SummaryCard>
              <SummaryCard>
                <SummaryTop>
                  <SummaryLabel>진행 중 교환</SummaryLabel>
                  <SummaryIcon>
                    <MyPageIcon name="exchange" />
                  </SummaryIcon>
                </SummaryTop>
                <SummaryValue>{summaryValue(inProgressCount)}</SummaryValue>
                <SummaryDescription>현재 교환 중인 글</SummaryDescription>
              </SummaryCard>
              <SummaryCard>
                <SummaryTop>
                  <SummaryLabel>관심 가챠</SummaryLabel>
                  <SummaryIcon>
                    <MyPageIcon name="heart" />
                  </SummaryIcon>
                </SummaryTop>
                <SummaryValue>—</SummaryValue>
                <SummaryDescription>관심 API 연결 준비 중</SummaryDescription>
              </SummaryCard>
              <SummaryCard>
                <SummaryTop>
                  <SummaryLabel>관심 매장</SummaryLabel>
                  <SummaryIcon>
                    <MyPageIcon name="store" />
                  </SummaryIcon>
                </SummaryTop>
                <SummaryValue>—</SummaryValue>
                <SummaryDescription>관심 API 연결 준비 중</SummaryDescription>
              </SummaryCard>
            </SummaryGrid>

            <Card>
              <CardHeader>
                <CardTitle>내 교환글</CardTitle>
                <CardLink href="/trade">전체 보기</CardLink>
              </CardHeader>

              {tradeStatus === 'loading' ? (
                <StatePanel role="status">
                  <StateTitle>내 교환글을 불러오고 있어요</StateTitle>
                </StatePanel>
              ) : tradeStatus === 'error' ? (
                <StatePanel role="alert">
                  <StateTitle>내 교환글을 불러오지 못했어요</StateTitle>
                  <StateDescription>{errorMessage}</StateDescription>
                  <RetryButton
                    type="button"
                    onClick={() => {
                      captureAnalyticsEvent('recovery_action_selected', {
                        feature: 'mypage_trades',
                      });
                      retry();
                    }}
                  >
                    다시 시도
                  </RetryButton>
                </StatePanel>
              ) : recentTrades.length === 0 ? (
                <StatePanel>
                  <StateTitle>아직 올린 교환글이 없어요</StateTitle>
                  <StateDescription>
                    교환 기능이 열리면 내 교환글을 여기서 관리할 수 있어요.
                  </StateDescription>
                </StatePanel>
              ) : (
                <TradeList>
                  {recentTrades.map((trade) => (
                    <TradeItem key={trade.tradeId}>
                      <TradeThumbnail
                        src={trade.thumbnailUrl || gachiGachaLogo}
                        alt=""
                      />
                      <TradeCopy>
                        <TradeTitle>{trade.title}</TradeTitle>
                        <TradeMeta>{getTradeMeta(trade)}</TradeMeta>
                      </TradeCopy>
                      <TradeSide>
                        <TradeStatusBadge status={trade.status} />
                        <TradeEditLink
                          to={`/trade/${trade.tradeId}/edit`}
                          aria-label={`${trade.title} 수정`}
                          onClick={() =>
                            captureAnalyticsEvent('trade_edit_started', {
                              trade_id: trade.tradeId,
                              source: 'mypage',
                            })
                          }
                        >
                          수정
                        </TradeEditLink>
                        <TradeDeleteButton
                          type="button"
                          aria-label={`${trade.title} 삭제`}
                          onClick={() => {
                            captureAnalyticsEvent('trade_delete_started', {
                              trade_id: trade.tradeId,
                              source: 'mypage',
                            });
                            setDeleteTarget(trade);
                          }}
                        >
                          삭제
                        </TradeDeleteButton>
                      </TradeSide>
                    </TradeItem>
                  ))}
                </TradeList>
              )}
            </Card>

            <InterestGrid>
              <Card>
                <CardHeader>
                  <CardTitle>관심 가챠</CardTitle>
                  <PreparationBadge>API 준비 중</PreparationBadge>
                </CardHeader>
                <InterestBody>
                  <EmptyIcon>
                    <MyPageIcon name="heart" />
                  </EmptyIcon>
                  <StateTitle>관심 가챠를 모을 준비 중이에요</StateTitle>
                  <StateDescription>
                    관심 기능이 연결되면 저장한 가챠를 여기서 확인할 수 있어요.
                  </StateDescription>
                </InterestBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>관심 매장</CardTitle>
                  <PreparationBadge>API 준비 중</PreparationBadge>
                </CardHeader>
                <InterestBody>
                  <EmptyIcon>
                    <MyPageIcon name="store" />
                  </EmptyIcon>
                  <StateTitle>관심 매장을 모을 준비 중이에요</StateTitle>
                  <StateDescription>
                    저장한 매장을 빠르게 다시 찾을 수 있도록 연결할게요.
                  </StateDescription>
                </InterestBody>
              </Card>
            </InterestGrid>

            <Card>
              <CardTitle>계정 관리</CardTitle>
              <AccountMenu>
                <AccountMenuLink
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    captureAnalyticsEvent('account_menu_selected', {
                      target: 'privacy',
                      source: 'mypage',
                    })
                  }
                >
                  <AccountMenuIcon>
                    <MyPageIcon name="privacy" />
                  </AccountMenuIcon>
                  <AccountMenuCopy>
                    <AccountMenuLabel>개인정보처리방침</AccountMenuLabel>
                    <AccountMenuDescription>
                      개인정보 처리와 보관 기준을 확인해요
                    </AccountMenuDescription>
                  </AccountMenuCopy>
                  <MyPageIcon name="chevron" size={18} />
                </AccountMenuLink>
                <AccountMenuLink
                  href={SUPPORT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    captureAnalyticsEvent('account_menu_selected', {
                      target: 'support',
                      source: 'mypage',
                    })
                  }
                >
                  <AccountMenuIcon>
                    <MyPageIcon name="support" />
                  </AccountMenuIcon>
                  <AccountMenuCopy>
                    <AccountMenuLabel>고객센터</AccountMenuLabel>
                    <AccountMenuDescription>
                      인스타그램 DM으로 문의해 주세요
                    </AccountMenuDescription>
                  </AccountMenuCopy>
                  <MyPageIcon name="chevron" size={18} />
                </AccountMenuLink>
                <LogoutMenuButton type="button" onClick={handleLogout}>
                  <AccountMenuIcon>
                    <MyPageIcon name="logout" />
                  </AccountMenuIcon>
                  <AccountMenuCopy>
                    <AccountMenuLabel>로그아웃</AccountMenuLabel>
                    <AccountMenuDescription>
                      이 브라우저의 로그인 정보를 삭제해요
                    </AccountMenuDescription>
                  </AccountMenuCopy>
                  <MyPageIcon name="chevron" size={18} />
                </LogoutMenuButton>
                <DeleteAccountMenuButton
                  type="button"
                  onClick={() => {
                    captureAnalyticsEvent('account_menu_selected', {
                      target: 'delete_account',
                      source: 'mypage',
                    });
                    setIsDeletionDialogOpen(true);
                  }}
                >
                  <AccountMenuIcon>
                    <MyPageIcon name="delete" />
                  </AccountMenuIcon>
                  <AccountMenuCopy>
                    <AccountMenuLabel>회원 탈퇴</AccountMenuLabel>
                    <AccountMenuDescription>
                      가치가챠 계정을 삭제해요
                    </AccountMenuDescription>
                  </AccountMenuCopy>
                  <MyPageIcon name="chevron" size={18} />
                </DeleteAccountMenuButton>
              </AccountMenu>
            </Card>
          </Content>
        </Dashboard>
      </Main>

      <ProfileEditDialog
        open={isProfileDialogOpen}
        member={member}
        onClose={() => setIsProfileDialogOpen(false)}
        onSave={updateProfile}
        onSaved={() => setProfileNotice('프로필 정보를 저장했어요.')}
      />
      <AccountDeletionDialog
        open={isDeletionDialogOpen}
        onClose={() => setIsDeletionDialogOpen(false)}
        onDelete={handleDeleteAccount}
      />
      {deleteTarget && (
        <TradeDeleteDialog
          open
          tradeId={deleteTarget.tradeId}
          tradeTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            retry();
          }}
        />
      )}
    </Page>
  );
}
