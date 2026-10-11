import { useMemo, useState } from 'react';
import styled from '@emotion/styled';

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
} from '../../model/tradeComment';

const MAX_COMMENT_LENGTH = 500;

interface TradeCommentsProps {
  comments?: TradeComment[];
  viewer?: TradeCommentAuthor | null;
  onSubmit?: ((content: string) => void) | undefined;
  onCommentAction?:
    ((action: TradeCommentAction, comment: TradeComment) => void) | undefined;
}

type CommentSort = 'newest' | 'oldest';

export function TradeComments({
  comments = [],
  viewer = null,
  onSubmit,
  onCommentAction,
}: TradeCommentsProps) {
  const [draft, setDraft] = useState('');
  const [sort, setSort] = useState<CommentSort>('newest');
  const sortedComments = useMemo(
    () =>
      [...comments].sort((left, right) => {
        const difference =
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime();

        return sort === 'newest' ? difference : -difference;
      }),
    [comments, sort],
  );
  const commentCount = comments.length;
  const isReady = Boolean(viewer && onSubmit);
  const canSubmit = isReady && draft.trim().length > 0;

  function submitComment() {
    if (!canSubmit) {
      return;
    }

    onSubmit?.(draft.trim());
    setDraft('');
  }

  return (
    <Section aria-labelledby="trade-comments-title">
      <Header>
        <Title id="trade-comments-title">
          댓글 <Count>{commentCount}</Count>
        </Title>
        <SortSelect
          aria-label="댓글 정렬"
          value={sort}
          onChange={(event) => setSort(event.target.value as CommentSort)}
        >
          <option value="newest">최신순</option>
          <option value="oldest">등록순</option>
        </SortSelect>
      </Header>

      <Composer data-ready={isReady}>
        <Avatar author={viewer} />
        <ComposerBody>
          <CommentInput
            aria-label="댓글 내용"
            value={draft}
            maxLength={MAX_COMMENT_LENGTH}
            disabled={!isReady}
            placeholder={
              isReady
                ? '댓글을 입력해주세요.'
                : viewer
                  ? '댓글 API 연동 후 작성할 수 있어요.'
                  : '로그인 후 댓글을 작성할 수 있어요.'
            }
            onChange={(event) => setDraft(event.target.value)}
          />
          <ComposerFooter>
            {!isReady && <PreparationNote>댓글 기능 준비 중</PreparationNote>}
            <CharacterCount aria-live="polite">
              {draft.length}/{MAX_COMMENT_LENGTH}
            </CharacterCount>
            <SubmitButton
              type="button"
              disabled={!canSubmit}
              onClick={submitComment}
            >
              등록
            </SubmitButton>
          </ComposerFooter>
        </ComposerBody>
      </Composer>

      {sortedComments.length > 0 ? (
        <CommentList role="region" aria-label="댓글 목록">
          {sortedComments.map((comment) => (
            <CommentThread
              key={comment.commentId}
              comment={comment}
              onCommentAction={onCommentAction}
            />
          ))}
        </CommentList>
      ) : (
        <EmptyState>
          <EmptyTitle>아직 댓글이 없어요</EmptyTitle>
          <EmptyDescription>
            첫 댓글로 교환 이야기를 시작해 보세요.
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
}

function CommentThread({ comment, onCommentAction }: CommentThreadProps) {
  return (
    <Thread>
      <CommentCard comment={comment} onCommentAction={onCommentAction} />
    </Thread>
  );
}

function CommentCard({ comment, onCommentAction }: CommentThreadProps) {
  const actions: Array<{ action: TradeCommentAction; label: string }> = [
    {
      action: 'like',
      label: `좋아요${comment.likeCount > 0 ? ` ${comment.likeCount}` : ''}`,
    },
    ...(comment.isMine
      ? ([
          { action: 'edit', label: '수정' },
          { action: 'delete', label: '삭제' },
        ] as const)
      : ([{ action: 'report', label: '신고' }] as const)),
  ];

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
        </CommentHeading>
        <CommentText>{comment.content}</CommentText>
        <CommentActions aria-label={`${comment.author.nickname} 댓글 작업`}>
          {actions.map(({ action, label }) => (
            <ActionButton
              key={action}
              type="button"
              data-liked={action === 'like' && comment.isLiked}
              disabled={!onCommentAction}
              onClick={() => onCommentAction?.(action, comment)}
            >
              {label}
            </ActionButton>
          ))}
        </CommentActions>
      </CommentContent>
      <MenuButton
        type="button"
        aria-label={`${comment.author.nickname} 댓글 메뉴`}
        disabled={!onCommentAction}
        onClick={() =>
          onCommentAction?.(comment.isMine ? 'edit' : 'report', comment)
        }
      >
        <MoreIcon />
      </MenuButton>
    </CommentLayout>
  );
}

function Avatar({ author }: { author?: TradeCommentAuthor | null }) {
  const label = author?.nickname ?? '게스트';

  return (
    <AvatarFrame aria-label={`${label} 프로필`}>
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

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
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

const SortSelect = styled.select`
  min-width: 104px;
  padding: 10px 34px 10px 14px;
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:focus-visible {
    outline: 0;
    box-shadow: ${focusRing};
  }
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
  grid-template-columns: 44px minmax(0, 1fr) 36px;
  align-items: start;
  gap: ${space.sm};

  @media (max-width: ${breakpoint.compact}) {
    grid-template-columns: 36px minmax(0, 1fr) 28px;
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

  &[data-liked='true'] {
    color: ${color.primary};
    font-weight: ${fontWeight.bold};
  }

  &:disabled {
    cursor: default;
    opacity: 1;
  }
`;

const MenuButton = styled.button`
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${radius.circle};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${color.surfaceMuted};
  }

  &:disabled {
    cursor: default;
  }

  svg {
    fill: currentcolor;
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

const EmptyTitle = styled.strong`
  display: block;
  color: ${color.text};
  font-size: ${fontSize.subheading};
`;

const EmptyDescription = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
`;
