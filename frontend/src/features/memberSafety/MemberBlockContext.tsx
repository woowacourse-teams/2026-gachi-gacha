import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import {
  type BlockedMember,
  requestMemberBlock,
  requestMemberUnblock,
} from './api/memberBlockApi';

const BLOCKED_MEMBER_IDS_KEY = 'gachi-gacha:blocked-member-ids:v1';

interface MemberBlockValue {
  blockedMemberIds: ReadonlySet<number>;
  isMemberBlocked: (memberId: number | null | undefined) => boolean;
  blockMember: (memberId: number, source: MemberSafetySource) => Promise<void>;
  unblockMember: (
    memberId: number,
    source: MemberSafetySource,
  ) => Promise<void>;
  syncBlockedMembers: (members: BlockedMember[]) => void;
}

export type MemberSafetySource = 'trade' | 'comment' | 'chat' | 'mypage';

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
};

const MemberBlockContext = createContext<MemberBlockValue>(DEFAULT_VALUE);

export function MemberBlockProvider({ children }: { children: ReactNode }) {
  const [blockedMemberIds, setBlockedMemberIds] =
    useState<Set<number>>(readCachedMemberIds);

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
    async (memberId: number, source: MemberSafetySource) => {
      try {
        await requestMemberBlock(memberId);
        updateMemberIds((current) => new Set([...current, memberId]));
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
    }),
    [blockMember, blockedMemberIds, syncBlockedMembers, unblockMember],
  );

  return (
    <MemberBlockContext.Provider value={value}>
      {children}
    </MemberBlockContext.Provider>
  );
}

export function useMemberBlocks(): MemberBlockValue {
  return useContext(MemberBlockContext);
}
