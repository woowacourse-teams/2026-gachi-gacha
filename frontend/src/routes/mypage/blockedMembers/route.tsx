import { useCallback, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import {
  getBlockedMembers,
  type BlockedMember,
} from '@/features/memberSafety/api/memberBlockApi';
import { useMemberBlocks } from '@/features/memberSafety/MemberBlockContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';

const blockedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

type PageStatus = 'loading' | 'success' | 'error';

function formatBlockedAt(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '차단 날짜를 확인할 수 없어요'
    : `${blockedAtFormatter.format(date)} 차단`;
}

export function BlockedMembersRoute() {
  const { syncBlockedMembers, unblockMember } = useMemberBlocks();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [members, setMembers] = useState<BlockedMember[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [unblockingMemberId, setUnblockingMemberId] = useState<number | null>(
    null,
  );
  const [unblockError, setUnblockError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBlockedMembers() {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const nextMembers = await getBlockedMembers(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setMembers(nextMembers);
        syncBlockedMembers(nextMembers);
        setStatus('success');
        captureAnalyticsEvent('blocked_members_load_completed', {
          outcome: 'success',
          blocked_member_count: nextMembers.length,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStatus('error');
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '차단한 사용자 목록을 불러오지 못했습니다.',
        );
        captureAnalyticsEvent('blocked_members_load_completed', {
          outcome: 'failure',
          blocked_member_count: 0,
        });
      }
    }

    void loadBlockedMembers();
    return () => controller.abort();
  }, [attempt, syncBlockedMembers]);

  const handleUnblock = useCallback(
    async (member: BlockedMember) => {
      if (unblockingMemberId !== null) {
        return;
      }

      setUnblockingMemberId(member.memberId);
      setUnblockError(null);

      try {
        await unblockMember(member.memberId, 'mypage');
        setMembers((current) =>
          current.filter(({ memberId }) => memberId !== member.memberId),
        );
      } catch (error) {
        setUnblockError(
          error instanceof Error
            ? error.message
            : '차단을 해제하지 못했습니다.',
        );
      } finally {
        setUnblockingMemberId(null);
      }
    },
    [unblockMember, unblockingMemberId],
  );

  return (
    <Page>
      <AppHeader currentPath="/mypage" />
      <Main>
        <BackLink to="/mypage">← 마이페이지</BackLink>
        <Header>
          <Heading>차단한 사용자</Heading>
          <Description>
            차단한 사용자의 교환글, 댓글과 채팅은 표시되지 않아요.
          </Description>
        </Header>

        <Card>
          {status === 'loading' ? (
            <StatePanel role="status">차단 목록을 불러오고 있어요.</StatePanel>
          ) : status === 'error' ? (
            <StatePanel role="alert">
              <strong>차단 목록을 불러오지 못했어요</strong>
              <span>{errorMessage}</span>
              <RetryButton
                type="button"
                onClick={() => setAttempt((current) => current + 1)}
              >
                다시 시도
              </RetryButton>
            </StatePanel>
          ) : members.length === 0 ? (
            <StatePanel>
              <strong>차단한 사용자가 없어요</strong>
              <span>차단하면 이곳에서 언제든 해제할 수 있어요.</span>
            </StatePanel>
          ) : (
            <MemberList aria-label="차단한 사용자 목록">
              {members.map((member) => (
                <MemberItem key={member.memberId}>
                  <Avatar aria-hidden="true">
                    {member.nickname.trim().slice(0, 1) || '?'}
                  </Avatar>
                  <MemberCopy>
                    <MemberName>{member.nickname}</MemberName>
                    <BlockedAt>{formatBlockedAt(member.blockedAt)}</BlockedAt>
                  </MemberCopy>
                  <UnblockButton
                    type="button"
                    disabled={unblockingMemberId !== null}
                    onClick={() => void handleUnblock(member)}
                  >
                    {unblockingMemberId === member.memberId
                      ? '해제 중...'
                      : '차단 해제'}
                  </UnblockButton>
                </MemberItem>
              ))}
            </MemberList>
          )}
          {unblockError && (
            <UnblockError role="alert">{unblockError}</UnblockError>
          )}
        </Card>
      </Main>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: ${color.surfaceMuted};
`;

const Main = styled.main`
  width: min(100% - 32px, 760px);
  padding: ${space.xxl} 0 80px;
  margin: 0 auto;
`;

const BackLink = styled(Link)`
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-decoration: none;

  &:hover {
    color: ${color.primary};
  }
`;

const Header = styled.header`
  margin-top: ${space.lg};
`;

const Heading = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
`;

const Description = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.body};
`;

const Card = styled.section`
  padding: ${space.xl};
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  margin-top: ${space.xl};
  background: ${color.surface};
  box-shadow: ${shadow.card};

  @media (max-width: 520px) {
    padding: ${space.md};
  }
`;

const MemberList = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
`;

const MemberItem = styled.li`
  display: grid;
  min-height: 72px;
  padding: ${space.sm} 0;
  align-items: center;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: ${space.sm};

  & + & {
    border-top: 1px solid ${color.borderSubtle};
  }
`;

const Avatar = styled.span`
  display: grid;
  width: 44px;
  height: 44px;
  border-radius: ${radius.circle};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-weight: ${fontWeight.extraBold};
  place-items: center;
`;

const MemberCopy = styled.span`
  min-width: 0;
`;

const MemberName = styled.strong`
  display: block;
  overflow: hidden;
  color: ${color.text};
  font-size: ${fontSize.body};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BlockedAt = styled.span`
  display: block;
  margin-top: 2px;
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
`;

const UnblockButton = styled.button`
  min-height: 40px;
  padding: 0 ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: ${color.primary};
    color: ${color.primary};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const StatePanel = styled.div`
  display: grid;
  min-height: 180px;
  place-content: center;
  justify-items: center;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  gap: ${space.xs};
  text-align: center;

  strong {
    color: ${color.text};
    font-size: ${fontSize.body};
  }
`;

const RetryButton = styled.button`
  min-height: 40px;
  padding: 0 ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  margin-top: ${space.sm};
  background: ${color.surface};
  color: ${color.primary};
  cursor: pointer;
  font-weight: ${fontWeight.bold};
`;

const UnblockError = styled.p`
  padding: ${space.sm};
  border-radius: ${radius.control};
  margin: ${space.md} 0 0;
  background: ${color.primarySoft};
  color: #d80f42;
  font-size: ${fontSize.bodySmall};
`;
