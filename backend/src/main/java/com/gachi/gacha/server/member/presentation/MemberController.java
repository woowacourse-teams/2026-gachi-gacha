package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.member.application.MemberService;
import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.presentation.dto.MemberDeleteResponse;
import com.gachi.gacha.server.member.presentation.dto.MemberRequest;
import com.gachi.gacha.server.member.presentation.dto.MemberResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/me")
    public BaseResponse<MemberResponse> readMember(@Auth final Long memberId) {
        MemberInfo memberInfo = memberService.getMemberInfo(memberId);
        return BaseResponse.ok(MemberResponse.from(memberInfo));
    }

    @PatchMapping("/me")
    public BaseResponse<MemberResponse> updateMember(
            @Auth final Long memberId,
            @Valid @RequestBody final MemberRequest memberRequest
    ) {
        MemberInfo memberInfo = memberService.modifyMember(memberId, memberRequest.toCommand());
        return BaseResponse.updated(MemberResponse.from(memberInfo));
    }

    @DeleteMapping("/me")
    public BaseResponse<MemberDeleteResponse> deleteMember(@Auth final Long memberId) {
        MemberDeleteResult result = memberService.removeMember(memberId);
        return BaseResponse.deleted(MemberDeleteResponse.from(result));
    }
}
