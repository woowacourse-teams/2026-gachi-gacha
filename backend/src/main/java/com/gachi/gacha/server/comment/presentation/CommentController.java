package com.gachi.gacha.server.comment.presentation;

import com.gachi.gacha.server.comment.application.CommentService;
import com.gachi.gacha.server.comment.application.dto.CommentInfo;
import com.gachi.gacha.server.comment.presentation.dto.CommentCreateRequest;
import com.gachi.gacha.server.comment.presentation.dto.CommentListResponse;
import com.gachi.gacha.server.comment.presentation.dto.CommentResponse;
import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.SwaggerConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.common.web.ClientIp;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "댓글", description = "교환 게시글 댓글. 비회원도 작성할 수 있고 대댓글은 없다.")
@RestController
@RequestMapping("/trades/{tradeId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "댓글 작성 (로그인은 선택)")
    @SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
    @PostMapping
    public ResponseEntity<BaseResponse<CommentResponse>> createComment(
            @Auth(required = false) final Long memberId,
            @ClientIp final String clientIp,
            @Parameter(description = "교환 게시글 ID", example = "1") @PathVariable final Long tradeId,
            @Valid @RequestBody final CommentCreateRequest request
    ) {
        CommentInfo info = commentService.createComment(tradeId, memberId, clientIp, request.toCommand());

        // 댓글 단건 조회 API 가 없어 Location 은 목록을 가리킨다.
        return BaseResponse.created(
                ServletUriComponentsBuilder.fromCurrentRequest().build().toUri(),
                CommentResponse.from(info)
        );
    }

    @Operation(summary = "댓글 목록 조회")
    @GetMapping
    public BaseResponse<CommentListResponse> readComments(
            @Parameter(description = "교환 게시글 ID", example = "1") @PathVariable final Long tradeId
    ) {
        List<CommentInfo> infos = commentService.findComments(tradeId);

        return BaseResponse.ok(CommentListResponse.from(infos));
    }
}
