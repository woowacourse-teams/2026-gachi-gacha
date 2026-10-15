package com.gachi.gacha.server.comment.application.dto;

import org.jspecify.annotations.Nullable;

/**
 * @param nickname 비회원이 직접 지정한 이름. 비우면 기본값을 쓴다. 회원이면 무시된다.
 */
public record CommentCreateCommand(
        @Nullable String nickname,
        String content
) {
}
