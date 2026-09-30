package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "회원 정보 수정 요청")
public record MemberRequest(
        @Schema(
                description = "닉네임. 비울 수 없다.",
                example = "가챠러버",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "사용자 이름은 필수입니다.") String nickname,

        @Schema(
                description = "프로필 사진 URL. POST /files 로 업로드한 뒤 받은 URL 을 넣는다.",
                example = "https://techcourse-project-2026.s3.amazonaws.com/gachigacha/member/uuid.jpg"
        )
        String profileImageUrl,

        @Schema(description = "희망 교환 장소", example = "홍대입구역 8번 출구")
        String desireTradeLocation
) {
    public MemberUpdateCommand toCommand() {
        return MemberUpdateCommand.builder()
                .nickname(nickname)
                .profileImageUrl(profileImageUrl)
                .desireTradeLocation(desireTradeLocation)
                .build();
    }
}
