package com.gachi.gacha.server.comment.application.event;

import com.gachi.gacha.server.comment.domain.Comment;
import org.jspecify.annotations.Nullable;

/**
 * 커밋 이후 다른 스레드에서 처리되므로 엔티티 대신 필요한 값만 담는다.
 *
 * @param writerId   비회원 댓글이면 {@code null}
 * @param writerName 화면에 쓰는 작성자 표시 이름. 비회원은 마스킹된 IP 가 붙는다.
 */
public record CommentCreatedEvent(
        Long tradeId,
        Long commentId,
        @Nullable Long writerId,
        String writerName,
        String content
) {
    public static CommentCreatedEvent from(final Comment comment) {
        return new CommentCreatedEvent(
                comment.getTradeId(),
                comment.getId(),
                comment.getMemberId(),
                comment.displayName(),
                comment.getContent()
        );
    }
}
