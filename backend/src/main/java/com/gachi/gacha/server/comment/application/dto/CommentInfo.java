package com.gachi.gacha.server.comment.application.dto;

import com.gachi.gacha.server.comment.domain.Comment;
import java.time.LocalDateTime;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record CommentInfo(
        Long commentId,
        @Nullable Long memberId,
        String nickname,
        @Nullable String profileImageUrl,
        String content,
        LocalDateTime createdAt
) {
    /**
     * nickname 은 화면에 그대로 쓰는 최종 표시명이다. 비회원은 뒤에 마스킹된 IP 가 붙는다.
     */
    public static CommentInfo from(final Comment comment) {
        return CommentInfo.builder()
                .commentId(comment.getId())
                .memberId(comment.getMemberId())
                .nickname(comment.displayName())
                .profileImageUrl(comment.getProfileImageUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
