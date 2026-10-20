import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import {
  type BlockedMember,
  requestMemberBlock,
  requestMemberUnblock,
} from './api/memberBlockApi';
import { ReportDialog, type MemberReportSubmission } from './ReportDialog';
import { submitMemberReport } from './submitMemberReport';

const BLOCKED_MEMBER_IDS_KEY = 'gachi-gacha:blocked-member-ids:v1';

interface MemberBlockValue {
  blockedMemberIds: ReadonlySet<number>;
  isMemberBlocked: (memberId: number | null | undefined) => boolean;
  blockMember: (
    memberId: number,
    source: MemberSafetySource,
    targetNickname: string,
    referenceId?: string | null,
  ) => Promise<void>;
  unblockMember: (
    memberId: number,
    source: MemberSafetySource,
  ) => Promise<void>;
  syncBlockedMembers: (members: BlockedMember[]) => void;
  openMemberReport: (
    target: MemberReportTarget,
    entry?: MemberReportEntry,
  ) => void;
}

export type MemberSafetySource = 'trade' | 'comment' | 'chat' | 'mypage';
type MemberReportEntry = 'safety_menu' | 'post_block';

export interface MemberReportTarget {
  memberId: number | null;
  nickname: string;
  source: MemberSafetySource;
  referenceId?: string | null;
}

interface ActiveMemberReport extends MemberReportTarget {
  reportId: string;
}

function readCachedMemberIds(): Set<number> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(BLOCKED_MEMBER_IDS_KEY) ?? '[]',
    );

    return new Set(
      Array.isArray(value)
        ? value.filter(
            (memberId): memberId is number =>
              typeof memberId === 'number' &&
              Number.isSafeInteger(memberId) &&
              memberId > 0,
          )
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeCachedMemberIds(memberIds: ReadonlySet<number>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      BLOCKED_MEMBER_IDS_KEY,
      JSON.stringify([...memberIds]),
    );
  } catch {
    // 저장 공간 접근 실패가 차단 API 동작을 막지 않도록 메모리 상태만 유지합니다.
  }
}

const DEFAULT_VALUE: MemberBlockValue = {
  blockedMemberIds: new Set(),
  isMemberBlocked: () => false,
  blockMember: async () => {
    throw new Error('차단 기능을 사용할 수 없습니다.');
  },
  unblockMember: async () => {
    throw new Error('차단 해제 기능을 사용할 수 없습니다.');
  },
  syncBlockedMembers: () => undefined,
  openMemberReport: () => undefined,
};

const MemberBlockContext = createContext<MemberBlockValue>(DEFAULT_VALUE);

interface MemberBlockProviderProps {
  children: ReactNode;
  reportEndpoint?: string;
}

export function MemberBlockProvider({
  children,
  reportEndpoint = __MEMBER_REPORT_ENDPOINT__,
}: MemberBlockProviderProps) {
  const { memberId: reporterMemberId } = useAuthSession();
  const [blockedMemberIds, setBlockedMemberIds] =
    useState<Set<number>>(readCachedMemberIds);
  const [postBlockTarget, setPostBlockTarget] =
    useState<MemberReportTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<ActiveMemberReport | null>(
    null,
  );

  const updateMemberIds = useCallback(
    (update: (current: ReadonlySet<number>) => Set<number>) => {
      setBlockedMemberIds((current) => {
        const next = update(current);
        writeCachedMemberIds(next);
        return next;
      });
    },
    [],
  );

  const blockMember = useCallback(
    async (
      memberId: number,
      source: MemberSafetySource,
      targetNickname: string,
      referenceId: string | null = null,
    ) => {
      try {
        await requestMemberBlock(memberId);
        updateMemberIds((current) => new Set([...current, memberId]));
        setPostBlockTarget({
          memberId,
          nickname: targetNickname,
          source,
          referenceId,
        });
        captureAnalyticsEvent('member_block_completed', {
          source,
          outcome: 'success',
        });
      } catch (error) {
        captureAnalyticsEvent('member_block_completed', {
          source,
          outcome: 'failure',
        });
        throw error;
      }
    },
    [updateMemberIds],
  );

  const openMemberReport = useCallback(
    (target: MemberReportTarget, entry: MemberReportEntry = 'safety_menu') => {
      setReportTarget({ ...target, reportId: createReportId() });
      captureAnalyticsEvent('member_report_form_opened', {
        source: target.source,
        entry,
      });
    },
    [],
  );

  const unblockMember = useCallback(
    async (memberId: number, source: MemberSafetySource) => {
      try {
        await requestMemberUnblock(memberId);
        updateMemberIds((current) => {
          const next = new Set(current);
          next.delete(memberId);
          return next;
        });
        captureAnalyticsEvent('member_unblock_completed', {
          source,
          outcome: 'success',
        });
      } catch (error) {
        captureAnalyticsEvent('member_unblock_completed', {
          source,
          outcome: 'failure',
        });
        throw error;
      }
    },
    [updateMemberIds],
  );

  const syncBlockedMembers = useCallback(
    (members: BlockedMember[]) => {
      updateMemberIds(() => new Set(members.map(({ memberId }) => memberId)));
    },
    [updateMemberIds],
  );

  const value = useMemo<MemberBlockValue>(
    () => ({
      blockedMemberIds,
      isMemberBlocked: (memberId) =>
        memberId !== null &&
        memberId !== undefined &&
        blockedMemberIds.has(memberId),
      blockMember,
      unblockMember,
      syncBlockedMembers,
      openMemberReport,
    }),
    [
      blockMember,
      blockedMemberIds,
      openMemberReport,
      syncBlockedMembers,
      unblockMember,
    ],
  );

  const normalizedReportEndpoint = reportEndpoint.trim();
  const submitReport =
    reportTarget && normalizedReportEndpoint
      ? (submission: MemberReportSubmission) =>
          submitMemberReport(
            {
              ...submission,
              reportId: reportTarget.reportId,
              reporterMemberId,
              targetMemberId: reportTarget.memberId,
              targetNickname: reportTarget.nickname,
              source: reportTarget.source,
              referenceId: reportTarget.referenceId ?? null,
              pagePath:
                typeof window === 'undefined' ? '' : window.location.pathname,
              submittedAt: new Date().toISOString(),
              appVersion: __APP_VERSION__,
              environment: __APP_ENV__,
            },
            normalizedReportEndpoint,
          )
      : undefined;

  return (
    <MemberBlockContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={postBlockTarget !== null}
        title="차단이 완료됐어요"
        description={`${postBlockTarget?.nickname ?? '이 사용자'}님의 교환글, 댓글과 채팅은 더 이상 표시되지 않아요. 운영팀의 확인이 필요하다면 지금 이어서 신고할 수 있어요.`}
        confirmLabel="이어서 신고하기"
        cancelLabel="괜찮아요"
        onCancel={() => setPostBlockTarget(null)}
        onConfirm={() => {
          if (!postBlockTarget) {
            return;
          }

          const target = postBlockTarget;
          setPostBlockTarget(null);
          openMemberReport(target, 'post_block');
        }}
      />
      {reportTarget && (
        <ReportDialog
          open
          targetNickname={reportTarget.nickname}
          source={reportTarget.source}
          onClose={() => setReportTarget(null)}
          {...(submitReport ? { onSubmit: submitReport } : {})}
        />
      )}
    </MemberBlockContext.Provider>
  );
}

function createReportId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `report-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useMemberBlocks(): MemberBlockValue {
  return useContext(MemberBlockContext);
}
