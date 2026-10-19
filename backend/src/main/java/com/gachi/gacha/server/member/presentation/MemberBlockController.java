package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.SwaggerConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.member.application.dto.BlockedMemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberBlockResult;
import com.gachi.gacha.server.member.presentation.dto.BlockedMemberListResponse;
import com.gachi.gacha.server.member.presentation.dto.MemberBlockResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "회원 차단", description = "회원 차단·차단 해제·내 차단 목록 조회")
@SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberBlockController {

    private final MemberBlockService memberBlockService;

    @Operation(summary = "회원 차단", description = "이미 차단한 회원이면 최초 차단 시각을 그대로 반환한다.")
    @PutMapping("/{blockedMemberId}/block")
    public BaseResponse<MemberBlockResponse> blockMember(
            @Auth final Long memberId,
            @Parameter(description = "차단할 회원 ID", example = "1") @PathVariable final Long blockedMemberId
    ) {
        MemberBlockResult result = memberBlockService.block(memberId, blockedMemberId);
        return BaseResponse.updated(MemberBlockResponse.from(result));
    }

    @Operation(summary = "회원 차단 해제", description = "차단하지 않은 회원이어도 성공으로 처리한다.")
    @DeleteMapping("/{blockedMemberId}/block")
    public BaseResponse<Void> unblockMember(
            @Auth final Long memberId,
            @Parameter(description = "차단 해제할 회원 ID", example = "1") @PathVariable final Long blockedMemberId
    ) {
        memberBlockService.unblock(memberId, blockedMemberId);
        return BaseResponse.deleted(null);
    }

    @Operation(summary = "내 차단 목록 조회", description = "최근에 차단한 회원부터 반환한다.")
    @GetMapping("/me/blocks")
    public BaseResponse<BlockedMemberListResponse> readBlockedMembers(@Auth final Long memberId) {
        List<BlockedMemberInfo> blockedMemberInfos = memberBlockService.getBlockedMembers(memberId);
        return BaseResponse.ok(BlockedMemberListResponse.from(blockedMemberInfos));
    }
}
