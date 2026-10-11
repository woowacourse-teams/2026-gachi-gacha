import type { TradeComment, TradeCommentAuthor } from '../model/tradeComment';

export const COMMENT_VIEWER: TradeCommentAuthor = {
  memberId: '42',
  nickname: '가챠러 민지',
  profileImageUrl: null,
};

export const TRADE_COMMENTS: TradeComment[] = [
  {
    commentId: 'comment-1',
    author: {
      memberId: '12',
      nickname: '코브',
      profileImageUrl: null,
    },
    content: '혹시 쿠로미 제품이랑도 교환 가능한가요?',
    createdAt: '2026-10-11T13:50:00+09:00',
    likeCount: 2,
  },
  {
    commentId: 'comment-2',
    author: {
      memberId: '7',
      nickname: '가챠러 민지',
      profileImageUrl: null,
      isPostAuthor: true,
    },
    content: '같은 시리즈라면 교환 가능하고, 합정역에서도 만날 수 있어요.',
    createdAt: '2026-10-11T12:40:00+09:00',
    likeCount: 0,
    isMine: true,
  },
  {
    commentId: 'comment-3',
    author: {
      memberId: '33',
      nickname: '지니',
      profileImageUrl: null,
    },
    content: '상품 상태를 조금 더 자세히 볼 수 있을까요?',
    createdAt: '2026-10-11T11:10:00+09:00',
    likeCount: 1,
    isLiked: true,
  },
];
