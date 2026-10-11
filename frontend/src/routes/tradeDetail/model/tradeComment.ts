export interface TradeCommentAuthor {
  memberId: string;
  nickname: string;
  profileImageUrl: string | null;
  isPostAuthor?: boolean;
}

export interface TradeComment {
  commentId: string;
  author: TradeCommentAuthor;
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked?: boolean;
  isMine?: boolean;
}

export type TradeCommentAction = 'like' | 'report' | 'edit' | 'delete';
