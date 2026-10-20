import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMemberBlocks } from '@/features/memberSafety/MemberBlockContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import {
  createTradeComment,
  getTradeComments,
  type TradeCommentResponse,
} from './api/tradeCommentsApi';
import type {
  TradeComment,
  TradeCommentSubmission,
} from './model/tradeComment';

const LOADING_STATE: AsyncState<TradeCommentResponse[]> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

interface UseTradeCommentsOptions {
  tradeId: number;
  postAuthorId: number | null;
  viewerMemberId: string | null;
  isAuthenticated: boolean;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function orderByRegistration(
  comments: TradeCommentResponse[],
): TradeCommentResponse[] {
  return [...comments].sort(
    (leftComment, rightComment) =>
      leftComment.commentId - rightComment.commentId,
  );
}

function toTradeComment(
  comment: TradeCommentResponse,
  postAuthorId: number | null,
  viewerMemberId: string | null,
): TradeComment {
  const memberId = comment.memberId === null ? null : String(comment.memberId);

  return {
    commentId: String(comment.commentId),
    author: {
      memberId,
      nickname: comment.nickname,
      profileImageUrl: comment.profileImageUrl,
      isPostAuthor: comment.memberId === postAuthorId,
    },
    content: comment.content,
    createdAt: comment.createdAt,
    isMine: memberId !== null && memberId === viewerMemberId,
  };
}

export function useTradeComments({
  tradeId,
  postAuthorId,
  viewerMemberId,
  isAuthenticated,
}: UseTradeCommentsOptions) {
  const { isMemberBlocked } = useMemberBlocks();
  const [attempt, setAttempt] = useState(0);
  const [hasSubmittedComment, setHasSubmittedComment] = useState(false);
  const [state, setState] =
    useState<AsyncState<TradeCommentResponse[]>>(LOADING_STATE);

  useEffect(() => {
    setHasSubmittedComment(false);
  }, [tradeId]);

  const retry = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setState(LOADING_STATE);

    async function loadComments() {
      try {
        const comments = orderByRegistration(
          await getTradeComments(tradeId, controller.signal),
        );

        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'success', data: comments, errorMessage: null });
        captureAnalyticsEvent('trade_comments_load_completed', {
          trade_id: tradeId,
          outcome: 'success',
          comment_count: comments.length,
        });
      } catch (error: unknown) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        setState({
          status: 'error',
          data: null,
          errorMessage:
            error instanceof Error
              ? error.message
              : '댓글을 불러오지 못했습니다.',
        });
        captureAnalyticsEvent('trade_comments_load_completed', {
          trade_id: tradeId,
          outcome: 'failure',
          comment_count: 0,
        });
      }
    }

    void loadComments();

    return () => controller.abort();
  }, [attempt, tradeId]);

  const submit = useCallback(
    async (submission: TradeCommentSubmission) => {
      try {
        const createdComment = await createTradeComment({
          tradeId,
          submission,
          isAuthenticated,
        });

        setState((currentState) => {
          if (currentState.status !== 'success') {
            return currentState;
          }

          return {
            status: 'success',
            data: orderByRegistration([...currentState.data, createdComment]),
            errorMessage: null,
          };
        });

        if (state.status !== 'success') {
          retry();
        }

        captureAnalyticsEvent('trade_comment_submission_completed', {
          trade_id: tradeId,
          author_type: isAuthenticated ? 'member' : 'guest',
          outcome: 'success',
          comment_length: submission.content.length,
          has_custom_guest_nickname:
            !isAuthenticated && Boolean(submission.nickname),
        });
        setHasSubmittedComment(true);
      } catch (error) {
        captureAnalyticsEvent('trade_comment_submission_completed', {
          trade_id: tradeId,
          author_type: isAuthenticated ? 'member' : 'guest',
          outcome: 'failure',
          comment_length: submission.content.length,
          has_custom_guest_nickname:
            !isAuthenticated && Boolean(submission.nickname),
        });
        throw error;
      }
    },
    [isAuthenticated, retry, state.status, tradeId],
  );

  const comments = useMemo(
    () =>
      state.status === 'success'
        ? state.data
            .filter(
              ({ memberId }) => memberId === null || !isMemberBlocked(memberId),
            )
            .map((comment) =>
              toTradeComment(comment, postAuthorId, viewerMemberId),
            )
        : [],
    [isMemberBlocked, postAuthorId, state, viewerMemberId],
  );

  return { comments, state, submit, retry, hasSubmittedComment };
}
