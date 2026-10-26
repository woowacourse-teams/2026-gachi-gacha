import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../auth/AuthSessionContext';
import {
  type BlockedMember,
  getBlockedMembers,
  type MemberReportSubmission,
  type MemberReportTarget,
  type MemberSafetySource,
  requestMemberBlock,
  requestMemberUnblock,
  submitMemberReport,
} from './memberSafetyApi';
import { ReportDialog } from './ReportDialog';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface MemberSafetyValue {
  blockedMemberIds: ReadonlySet<number>;
  blockedMembers: readonly BlockedMember[];
  loadStatus: LoadStatus;
  loadErrorMessage: string | null;
  isMemberBlocked: (memberId: number | null | undefined) => boolean;
  blockMember: (
    memberId: number,
    source: MemberSafetySource,
    targetNickname: string,
    referenceId?: string | null,
  ) => Promise<void>;
  unblockMember: (memberId: number) => Promise<void>;
  refreshBlockedMembers: () => Promise<void>;
  openMemberReport: (target: MemberReportTarget) => void;
}

const MemberSafetyContext = createContext<MemberSafetyValue | null>(null);

export function MemberSafetyProvider({ children }: { children: ReactNode }) {
  const { memberId, status: authStatus } = useAuthSession();
  const [blockedMembers, setBlockedMembers] = useState<BlockedMember[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<MemberReportTarget | null>(null);

  const loadBlockedMembers = useCallback(async (signal?: AbortSignal) => {
    setLoadStatus('loading');
    setLoadErrorMessage(null);

    try {
      const members = await getBlockedMembers(signal);
      if (signal?.aborted) return;
      setBlockedMembers(members);
      setLoadStatus('success');
    } catch (error) {
      if (signal?.aborted) return;
      setLoadStatus('error');
      setLoadErrorMessage(
        error instanceof Error
          ? error.message
          : '차단한 사용자 목록을 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      setBlockedMembers([]);
      setLoadStatus('idle');
      setLoadErrorMessage(null);
      return;
    }

    const controller = new AbortController();
    void loadBlockedMembers(controller.signal);
    return () => controller.abort();
  }, [authStatus, loadBlockedMembers, memberId]);

  const openMemberReport = useCallback((target: MemberReportTarget) => {
    setReportTarget(target);
  }, []);

  const blockMember = useCallback(
    async (
      targetMemberId: number,
      source: MemberSafetySource,
      targetNickname: string,
      referenceId: string | null = null,
    ) => {
      await requestMemberBlock(targetMemberId);
      setBlockedMembers((current) => {
        if (current.some(({ memberId: currentId }) => currentId === targetMemberId)) {
          return current;
        }

        return [
          ...current,
          {
            memberId: targetMemberId,
            nickname: targetNickname,
            blockedAt: new Date().toISOString(),
          },
        ];
      });

      Alert.alert(
        '차단이 완료됐어요',
        `${targetNickname}님의 교환글, 댓글과 채팅은 더 이상 표시되지 않아요. 운영팀의 확인이 필요하다면 지금 이어서 신고할 수 있어요.`,
        [
          { text: '괜찮아요', style: 'cancel' },
          {
            text: '이어서 신고하기',
            onPress: () =>
              openMemberReport({
                memberId: targetMemberId,
                nickname: targetNickname,
                source,
                referenceId,
              }),
          },
        ],
      );
    },
    [openMemberReport],
  );

  const unblockMember = useCallback(async (targetMemberId: number) => {
    await requestMemberUnblock(targetMemberId);
    setBlockedMembers((current) =>
      current.filter(({ memberId: currentId }) => currentId !== targetMemberId),
    );
  }, []);

  const blockedMemberIds = useMemo(
    () => new Set(blockedMembers.map(({ memberId: blockedMemberId }) => blockedMemberId)),
    [blockedMembers],
  );

  const value = useMemo<MemberSafetyValue>(
    () => ({
      blockedMemberIds,
      blockedMembers,
      loadStatus,
      loadErrorMessage,
      isMemberBlocked: (targetMemberId) =>
        targetMemberId !== null &&
        targetMemberId !== undefined &&
        blockedMemberIds.has(targetMemberId),
      blockMember,
      unblockMember,
      refreshBlockedMembers: () => loadBlockedMembers(),
      openMemberReport,
    }),
    [
      blockMember,
      blockedMemberIds,
      blockedMembers,
      loadBlockedMembers,
      loadErrorMessage,
      loadStatus,
      openMemberReport,
      unblockMember,
    ],
  );

  async function handleReportSubmit(submission: MemberReportSubmission) {
    if (!reportTarget) return;
    await submitMemberReport(memberId, reportTarget, submission);
  }

  return (
    <MemberSafetyContext.Provider value={value}>
      {children}
      <ReportDialog
        onClose={() => setReportTarget(null)}
        onSubmit={handleReportSubmit}
        target={reportTarget}
      />
    </MemberSafetyContext.Provider>
  );
}

export function useMemberSafety(): MemberSafetyValue {
  const value = useContext(MemberSafetyContext);

  if (!value) {
    throw new Error('useMemberSafety는 MemberSafetyProvider 안에서 사용해야 합니다.');
  }

  return value;
}
