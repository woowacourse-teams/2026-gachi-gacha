import { useState } from 'react';
import styled from '@emotion/styled';

import { UserSafetyMenu } from '@/features/memberSafety/UserSafetyMenu';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import {
  breakpoint,
  color,
  focusRing,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  space,
} from '@/shared/styles/tokens';

import type {
  TradeComment,
  TradeCommentAction,
  TradeCommentAuthor,
  TradeCommentSubmission,
} from '../../model/tradeComment';

const MAX_COMMENT_LENGTH = 500;
const MAX_GUEST_NICKNAME_LENGTH = 20;

interface TradeCommentsProps {
  comments?: TradeComment[];
  commentsStatus?: 'loading' | 'success' | 'error';
  commentsErrorMessage?: string | null;
  viewer?: TradeCommentAuthor | null;
  onSubmit?:
    ((submission: TradeCommentSubmission) => Promise<void> | void) | undefined;
  onRetryComments?: (() => void) | undefined;
  onCommentAction?:
    ((action: TradeCommentAction, comment: TradeComment) => void) | undefined;
  showSafetyActions?: boolean | undefined;
}

export function TradeComments({
  comments = [],
  commentsStatus = 'success',
  commentsErrorMessage = null,
  viewer = null,
  onSubmit,
  onRetryComments,
  onCommentAction,
  showSafetyActions = false,
}: TradeCommentsProps) {
  const [draft, setDraft] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const commentCount = comments.length;
  const isReady = Boolean(onSubmit);
  const canSubmit = isReady && !isSubmitting && draft.trim().length > 0;

  async function submitComment() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit?.({
        nickname: viewer ? null : guestNickname.trim() || null,
        content: draft.trim(),
      });
      setDraft('');
    } catch {
      setSubmitError('댓글을 등록하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Section aria-labelledby="trade-comments-title">
      <Header>
        <Title id="trade-comments-title">
          댓글 <Count>{commentCount}</Count>
        </Title>
      </Header>

      <Composer data-ready={isReady}>
        <Avatar author={viewer} />
        <ComposerBody>
          {!viewer && (
            <GuestIdentity>
              <GuestNicknameInput
                aria-label="비회원 닉네임"
                value={guestNickname}
                maxLength={MAX_GUEST_NICKNAME_LENGTH}
                disabled={!isReady}
                placeholder="이름 (선택, 미입력 시 루챠)"
                onChange={(event) => setGuestNickname(event.target.value)}
              />
              <GuestPrivacyNotice>
                비회원 댓글에는 접속 IP 일부가 표시돼요.
              </GuestPrivacyNotice>
            </GuestIdentity>
          )}
          <CommentInput
            aria-label="댓글 내용"
            value={draft}
            maxLength={MAX_COMMENT_LENGTH}
            disabled={!isReady}
            placeholder={
              isReady ? '댓글을 입력해주세요.' : '댓글 기능을 준비하고 있어요.'
            }
            onChange={(event) => setDraft(event.target.value)}
          />
          <ComposerFooter>
            {submitError ? (
              <SubmissionError role="alert">{submitError}</SubmissionError>
            ) : (
              !isReady && <PreparationNote>댓글 기능 준비 중</PreparationNote>
            )}
            <CharacterCount aria-live="polite">
              {draft.length}/{MAX_COMMENT_LENGTH}
            </CharacterCount>
            <SubmitButton
              type="button"
              disabled={!canSubmit}
              onClick={() => void submitComment()}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </SubmitButton>
          </ComposerFooter>
        </ComposerBody>
      </Composer>

      {commentsStatus === 'loading' ? (
        <EmptyState aria-live="polite">
          <EmptyTitle>댓글을 불러오고 있어요</EmptyTitle>
          <EmptyDescription>잠시만 기다려 주세요.</EmptyDescription>
        </EmptyState>
      ) : commentsStatus === 'error' ? (
        <EmptyState role="alert">
          <EmptyTitle>댓글을 불러오지 못했어요</EmptyTitle>
          <EmptyDescription>
            {commentsErrorMessage ?? '잠시 후 다시 시도해 주세요.'}
          </EmptyDescription>
          <RetryButton type="button" onClick={onRetryComments}>
            다시 시도
          </RetryButton>
        </EmptyState>
      ) : comments.length > 0 ? (
        <CommentList role="region" aria-label="댓글 목록">
          {comments.map((comment) => (
            <CommentThread
              key={comment.commentId}
              comment={comment}
              onCommentAction={onCommentAction}
              showSafetyActions={showSafetyActions}
            />
          ))}
        </CommentList>
      ) : (
        <EmptyState>
          <EmptyTitle>
            {isReady ? '아직 댓글이 없어요' : '댓글 기능을 준비하고 있어요'}
          </EmptyTitle>
          <EmptyDescription>
            {isReady
              ? '첫 댓글로 교환 이야기를 시작해 보세요.'
              : '더 편하게 이야기를 나눌 수 있도록 준비 중이에요. 조금만 기다려 주세요.'}
          </EmptyDescription>
        </EmptyState>
      )}
    </Section>
  );
}

interface CommentThreadProps {
  comment: TradeComment;
  onCommentAction?:
    ((action: TradeCommentAction, comment: TradeComment) => void) | undefined;
  showSafetyActions?: boolean | undefined;
}

function CommentThread({
  comment,
  onCommentAction,
  showSafetyActions,
}: CommentThreadProps) {
  return (
    <Thread>
      <CommentCard
        comment={comment}
        onCommentAction={onCommentAction}
        showSafetyActions={showSafetyActions}
      />
    </Thread>
  );
}

function CommentCard({
  comment,
  onCommentAction,
  showSafetyActions,
}: CommentThreadProps) {
  const actions: Array<{ action: TradeCommentAction; label: string }> =
    comment.isMine && onCommentAction
      ? [
          { action: 'edit', label: '수정' },
          { action: 'delete', label: '삭제' },
        ]
      : [];

  return (
    <CommentLayout>
      <Avatar author={comment.author} />
      <CommentContent>
        <CommentHeading>
          <AuthorName>{comment.author.nickname}</AuthorName>
          {comment.author.isPostAuthor && <AuthorBadge>작성자</AuthorBadge>}
          <CreatedAt dateTime={comment.createdAt}>
            {formatRelativeTime(comment.createdAt)}
          </CreatedAt>
          {showSafetyActions && !comment.isMine && (
            <CommentSafetyMenu>
              <UserSafetyMenu
                targetMemberId={
                  comment.author.memberId === null
                    ? null
                    : Number(comment.author.memberId)
                }
                targetNickname={comment.author.nickname}
                source="comment"
                referenceId={comment.commentId}
              />
            </CommentSafetyMenu>
          )}
        </CommentHeading>
        <CommentText>{comment.content}</CommentText>
        {actions.length > 0 && (
          <CommentActions aria-label={`${comment.author.nickname} 댓글 작업`}>
            {actions.map(({ action, label }) => (
              <ActionButton
                key={action}
                type="button"
                onClick={() => onCommentAction?.(action, comment)}
              >
                {label}
              </ActionButton>
            ))}
          </CommentActions>
        )}
      </CommentContent>
    </CommentLayout>
  );
}

function Avatar({ author }: { author?: TradeCommentAuthor | null }) {
  return (
    <AvatarFrame aria-hidden="true">
      {author?.profileImageUrl ? (
        <AvatarImage src={author.profileImageUrl} alt="" data-private-media />
      ) : (
        <AvatarFallback aria-hidden="true">
          {author ? author.nickname.trim().slice(0, 1) : '?'}
        </AvatarFallback>
      )}
    </AvatarFrame>
  );
}

const Section = styled.section`
  padding: ${space.xxxl} 0 ${space.huge};
  border-top: 1px solid ${color.border};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space.md};
`;

const Title = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: 24px;
  letter-spacing: -0.03em;
`;

const Count = styled.span`
  color: ${color.primary};
`;

const Composer = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: ${space.sm};
  margin-top: ${space.lg};
  padding: ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surfaceMuted};

  &[data-ready='false'] {
    background: ${color.surface};
  }

  @media (max-width: ${breakpoint.compact}) {
    grid-template-columns: 36px minmax(0, 1fr);
    padding: ${space.sm};
  }
`;

const ComposerBody = styled.div`
  min-width: 0;
`;

const GuestIdentity = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space.xs} ${space.sm};
  margin-bottom: ${space.xs};
`;

const GuestNicknameInput = styled.input`
  width: min(100%, 240px);
  padding: ${space.xs} 4px;
  border: 0;
  border-bottom: 1px solid ${color.border};
  outline: 0;
  background: transparent;
  color: ${color.text};
  font-size: ${fontSize.bodySmall};

  &::placeholder {
    color: ${color.textSubtle};
  }

  &:focus-visible {
    border-color: ${color.primary};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const GuestPrivacyNotice = styled.span`
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
`;

const CommentInput = styled.textarea`
  width: 100%;
  min-height: 74px;
  padding: 2px 4px;
  resize: vertical;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${color.text};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};

  &::placeholder {
    color: ${color.textSubtle};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ComposerFooter = styled.div`
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: flex-end;
  gap: ${space.sm};
`;

const PreparationNote = styled.span`
  margin-right: auto;
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
`;

const SubmissionError = styled.span`
  margin-right: auto;
  color: ${color.primary};
  font-size: ${fontSize.caption};
`;

const CharacterCount = styled.span`
  color: ${color.textSubtle};
  font-size: ${fontSize.bodySmall};
`;

const SubmitButton = styled.button`
  min-width: 76px;
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: ${color.primary};
  color: ${color.surface};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${color.primaryHover};
  }

  &:focus-visible {
    outline: 0;
    box-shadow: ${focusRing};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.38;
  }
`;

const CommentList = styled.div`
  margin-top: ${space.xl};
`;

const Thread = styled.article`
  padding: ${space.xl} 0;
  border-bottom: 1px solid ${color.borderSubtle};
`;

const CommentLayout = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: start;
  gap: ${space.sm};

  @media (max-width: ${breakpoint.compact}) {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: ${space.xs};
  }
`;

const CommentContent = styled.div`
  min-width: 0;
`;

const CommentHeading = styled.div`
  display: flex;
  min-height: 24px;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space.xs};
`;

const AuthorName = styled.strong`
  color: ${color.text};
  font-size: ${fontSize.body};
`;

const AuthorBadge = styled.span`
  padding: 3px 8px;
  border-radius: ${radius.pill};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
`;

const CreatedAt = styled.time`
  color: ${color.textSubtle};
  font-size: ${fontSize.bodySmall};
`;

const CommentSafetyMenu = styled.span`
  margin-left: auto;
`;

const CommentText = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.text};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const CommentActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-top: ${space.xs};
`;

const ActionButton = styled.button`
  position: relative;
  padding: 4px 10px 4px 0;
  border: 0;
  background: transparent;
  color: ${color.textMuted};
  font-size: ${fontSize.label};
  cursor: pointer;

  & + & {
    padding-left: 10px;
  }

  & + &::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 2px;
    height: 2px;
    border-radius: ${radius.circle};
    background: ${color.textSubtle};
    content: '';
  }

  &:disabled {
    cursor: default;
    opacity: 1;
  }
`;

const AvatarFrame = styled.div`
  display: grid;
  width: 44px;
  height: 44px;
  overflow: hidden;
  place-items: center;
  border: 1px solid ${color.border};
  border-radius: ${radius.circle};
  background: ${color.primarySoft};

  @media (max-width: ${breakpoint.compact}) {
    width: 36px;
    height: 36px;
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarFallback = styled.span`
  color: ${color.primary};
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.extraBold};
`;

const EmptyState = styled.div`
  padding: 52px ${space.md};
  text-align: center;
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.subheading};
`;

const EmptyDescription = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
`;

const RetryButton = styled.button`
  min-height: 40px;
  margin-top: ${space.md};
  padding: 0 ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:hover {
    border-color: ${color.primary};
    color: ${color.primary};
  }

  &:focus-visible {
    outline: 0;
    box-shadow: ${focusRing};
  }
`;
