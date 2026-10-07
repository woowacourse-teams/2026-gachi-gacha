package com.gachi.gacha.server.comment.presentation.dto;

import com.gachi.gacha.server.comment.application.dto.CommentInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "댓글 목록. 대댓글이 없고 건수가 많지 않아 페이징 없이 전부 반환한다.")
public record CommentListResponse(
        @Schema(description = "등록순 댓글 목록")
        List<CommentResponse> comments,

        @Schema(description = "댓글 수", example = "3")
        int totalCount
) {
    public static CommentListResponse from(final List<CommentInfo> infos) {
        List<CommentResponse> comments = infos.stream()
                .map(CommentResponse::from)
                .toList();

        return new CommentListResponse(comments, comments.size());
    }
}
