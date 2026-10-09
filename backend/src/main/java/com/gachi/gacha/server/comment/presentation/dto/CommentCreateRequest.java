package com.gachi.gacha.server.comment.presentation.dto;

import com.gachi.gacha.server.comment.application.dto.CommentCreateCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

@Schema(description = "댓글 작성 요청")
public record CommentCreateRequest(
        @Schema(
                description = "비회원이 사용할 이름. 생략하면 '루챠' 가 쓰인다. 로그인 상태면 무시되고 회원 닉네임이 쓰인다.",
                example = "홍길동"
        )
        @Size(max = 20)
        @Nullable String nickname,

        @Schema(
                description = "댓글 내용",
                example = "저도 교환 원해요",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank
        @Size(max = 500)
        String content
) {
    public CommentCreateCommand toCommand() {
        return new CommentCreateCommand(nickname, content);
    }
}
