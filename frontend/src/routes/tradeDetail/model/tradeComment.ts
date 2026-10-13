export interface TradeCommentAuthor {
  memberId: string | null;
  nickname: string;
  profileImageUrl: string | null;
  isPostAuthor?: boolean;
}

export interface TradeCommentSubmission {
  nickname: string | null;
  content: string;
}

export interface TradeComment {
  commentId: string;
  author: TradeCommentAuthor;
  content: string;
  createdAt: string;
  isMine?: boolean;
}

export type TradeCommentAction = 'edit' | 'delete';
