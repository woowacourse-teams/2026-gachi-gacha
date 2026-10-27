import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { createLoginUrl } from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { OAUTH_WITHDRAW_CALLBACK_PATH } from '@/features/auth/oauthCallbackPath';
import { AccountDeletionDialog } from '@/routes/mypage/components/AccountDeletionDialog';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { assignBrowserLocation } from '@/shared/browser/browserNavigation';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import {
  AccountSummary,
  Actions,
  Brand,
  BrandLogo,
  Card,
  DangerButton,
  Description,
  ErrorMessage,
  Eyebrow,
  FinePrint,
  Information,
  InformationList,
  InformationTitle,
  InlineLink,
  Main,
  Page,
  PrimaryLink,
  SecondaryLink,
  TextButton,
  Title,
} from './route.styles';

const ACCOUNT_DELETION_PATH = '/account-deletion';
const WITHDRAW_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: 'Apple 본인 확인이 취소되었거나 실패했습니다.',
  invalid_state: '본인 확인 요청이 유효하지 않습니다. 다시 시도해주세요.',
  withdraw_failed: '회원 탈퇴를 완료하지 못했습니다. 다시 시도해주세요.',
};

export function AccountDeletionRoute() {
  const { pathname, search, hash } = useLocation();
  const { status, member, deleteAccount, completeAccountDeletion, retry } =
    useAuthSession();
  const [isDeletionDialogOpen, setIsDeletionDialogOpen] = useState(false);
  const [isDeletionComplete, setIsDeletionComplete] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const callbackHandledRef = useRef(false);

  useEffect(() => {
    if (status === 'loading' || callbackHandledRef.current || !hash) {
      return;
    }

    const isWithdrawPath =
      pathname === ACCOUNT_DELETION_PATH ||
      pathname === OAUTH_WITHDRAW_CALLBACK_PATH;

    if (!isWithdrawPath) {
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const result = params.get('result');
    const error = params.get('error');

    if (!result && !error) {
      return;
    }

    callbackHandledRef.current = true;
    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${search}`,
    );

    if (result === 'success') {
      completeAccountDeletion();
      setIsDeletionComplete(true);
      return;
    }

    setWithdrawError(
      error
        ? (WITHDRAW_ERROR_MESSAGES[error] ?? '회원 탈퇴를 완료하지 못했습니다.')
        : '회원 탈퇴 결과가 올바르지 않습니다.',
    );
  }, [completeAccountDeletion, hash, pathname, search, status]);

  if (status === 'loading') {
    return <PageLoadingFallback label="회원 정보를 확인하고 있어요." />;
  }

  async function handleDeleteAccount() {
    try {
      const result = await deleteAccount();

      if (result.status === 'reauthentication-required') {
        assignBrowserLocation(result.authorizationUrl);
        return;
      }

      captureAnalyticsEvent('account_deletion_completed', {
        outcome: 'success',
      });
      setIsDeletionComplete(true);
    } catch (error) {
      captureAnalyticsEvent('account_deletion_completed', {
        outcome: 'failure',
      });
      throw error;
    }
  }

  if (isDeletionComplete) {
    return (
      <Page>
        <Main>
          <Card aria-labelledby="account-deletion-complete-title">
            <Brand href="/trade" aria-label="GachiGacha 거래/교환으로 이동">
              <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
              <span>GachiGacha</span>
            </Brand>
            <Eyebrow>회원 탈퇴 완료</Eyebrow>
            <Title id="account-deletion-complete-title">
              계정 삭제 요청을 완료했어요
            </Title>
            <Description>
              이 브라우저의 로그인 정보도 함께 삭제했습니다. 그동안 가치가챠를
              이용해 주셔서 감사합니다.
            </Description>
            <Actions>
              <PrimaryLink href="/trade">거래/교환 둘러보기</PrimaryLink>
            </Actions>
          </Card>
        </Main>
      </Page>
    );
  }

  const isAuthenticated = status === 'authenticated';
  const accountLabel = member?.nickname ?? member?.name ?? '현재 로그인한 계정';

  return (
    <Page>
      <Main>
        <Card aria-labelledby="account-deletion-page-title">
          <Brand href="/trade" aria-label="GachiGacha 거래/교환으로 이동">
            <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
            <span>GachiGacha</span>
          </Brand>

          <Eyebrow>계정 및 데이터 관리</Eyebrow>
          <Title id="account-deletion-page-title">가치가챠 회원 탈퇴</Title>
          <Description>
            앱을 삭제했거나 앱에 접근하기 어려운 경우에도 이 페이지에서 본인
            확인 후 계정 삭제를 요청할 수 있습니다.
          </Description>

          {withdrawError && (
            <ErrorMessage role="alert">{withdrawError}</ErrorMessage>
          )}

          <Information>
            <InformationTitle>탈퇴 전에 확인해 주세요</InformationTitle>
            <InformationList>
              <li>탈퇴한 계정은 복구할 수 없습니다.</li>
              <li>프로필과 소셜 로그인 연결 정보가 삭제됩니다.</li>
              <li>
                관계 법령 또는 분쟁 대응을 위해 필요한 정보는 정해진 기간 동안
                분리 보관될 수 있습니다.
              </li>
            </InformationList>
          </Information>

          {status === 'error' && (
            <ErrorMessage role="alert">
              로그인 상태를 확인하지 못했습니다.
              <br />
              <TextButton type="button" onClick={retry}>
                다시 확인하기
              </TextButton>
            </ErrorMessage>
          )}

          {isAuthenticated && (
            <AccountSummary data-private>
              본인 확인 계정: <strong>{accountLabel}</strong>
            </AccountSummary>
          )}

          <Actions>
            <SecondaryLink href="/trade">취소</SecondaryLink>
            {isAuthenticated ? (
              <DangerButton
                type="button"
                onClick={() => {
                  captureAnalyticsEvent('account_menu_selected', {
                    target: 'delete_account',
                    source: 'account_deletion',
                  });
                  setIsDeletionDialogOpen(true);
                }}
              >
                회원 탈퇴 계속하기
              </DangerButton>
            ) : (
              <PrimaryLink
                href={createLoginUrl(ACCOUNT_DELETION_PATH)}
                onClick={() =>
                  captureAnalyticsEvent('account_menu_selected', {
                    target: 'delete_account',
                    source: 'account_deletion',
                  })
                }
              >
                본인 확인 후 탈퇴
              </PrimaryLink>
            )}
          </Actions>

          <FinePrint>
            계정 삭제와 개인정보 처리에 관한 자세한 내용은{' '}
            <InlineLink href="/privacy">개인정보처리방침</InlineLink>에서 확인할
            수 있습니다.
          </FinePrint>
        </Card>
      </Main>

      {isAuthenticated && (
        <AccountDeletionDialog
          open={isDeletionDialogOpen}
          onClose={() => setIsDeletionDialogOpen(false)}
          onDelete={handleDeleteAccount}
        />
      )}
    </Page>
  );
}
