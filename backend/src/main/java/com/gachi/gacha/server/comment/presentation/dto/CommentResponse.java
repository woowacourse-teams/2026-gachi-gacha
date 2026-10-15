package com.gachi.gacha.server.comment.presentation.dto;

import com.gachi.gacha.server.comment.application.dto.CommentInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Schema(description = "댓글")
@Builder
public record CommentResponse(
        @Schema(description = "댓글 ID", example = "1")
        Long commentId,

        @Schema(description = "작성자 회원 ID. null 이면 비회원이 쓴 댓글이다.", example = "5")
        @Nullable Long memberId,

        @Schema(
                description = "화면에 그대로 표시할 이름. 비회원은 뒤에 마스킹된 IP 가 붙는다.",
                example = "루챠-118.44"
        )
        String nickname,

        @Schema(description = "작성자 프로필 사진. 비회원은 null 이다.")
        @Nullable String profileImageUrl,

        @Schema(description = "댓글 내용", example = "저도 교환 원해요")
        String content,

        @Schema(description = "작성 일시")
        LocalDateTime createdAt
) {
    public static CommentResponse from(final CommentInfo info) {
        return CommentResponse.builder()
                .commentId(info.commentId())
                .memberId(info.memberId())
                .nickname(info.nickname())
                .profileImageUrl(info.profileImageUrl())
                .content(info.content())
                .createdAt(info.createdAt())
                .build();
    }
}
