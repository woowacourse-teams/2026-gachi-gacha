package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.SwaggerConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.member.application.MemberService;
import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.presentation.dto.MemberDeleteResponse;
import com.gachi.gacha.server.member.presentation.dto.MemberRequest;
import com.gachi.gacha.server.member.presentation.dto.MemberResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "회원", description = "내 정보 조회·수정·탈퇴")
@SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public BaseResponse<MemberResponse> readMember(@Auth final Long memberId) {
        MemberInfo memberInfo = memberService.getMemberInfo(memberId);
        return BaseResponse.ok(MemberResponse.from(memberInfo));
    }

    @Operation(summary = "내 정보 수정")
    @PatchMapping("/me")
    public BaseResponse<MemberResponse> updateMember(
            @Auth final Long memberId,
            @Valid @RequestBody final MemberRequest memberRequest
    ) {
        MemberInfo memberInfo = memberService.modifyMember(memberId, memberRequest.toCommand());
        return BaseResponse.updated(MemberResponse.from(memberInfo));
    }

    @Operation(summary = "회원 탈퇴")
    @DeleteMapping("/me")
    public BaseResponse<MemberDeleteResponse> deleteMember(@Auth final Long memberId) {
        MemberDeleteResult result = memberService.removeMember(memberId);
        return BaseResponse.deleted(MemberDeleteResponse.from(result));
    }
}
