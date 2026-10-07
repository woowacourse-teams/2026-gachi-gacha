package com.gachi.gacha.server.trade.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.SwaggerConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.trade.application.TradeService;
import com.gachi.gacha.server.usecase.application.TradeCommentService;
import com.gachi.gacha.server.usecase.application.dto.TradeDetailInfo;
import com.gachi.gacha.server.trade.application.dto.TradeInfo;
import com.gachi.gacha.server.trade.application.dto.TradeSearchCondition;
import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import com.gachi.gacha.server.trade.presentation.dto.TradeCreateRequest;
import com.gachi.gacha.server.trade.presentation.dto.TradeResponse;
import com.gachi.gacha.server.trade.presentation.dto.TradeStatusUpdateRequest;
import com.gachi.gacha.server.trade.presentation.dto.TradeSummaryResponse;
import com.gachi.gacha.server.trade.presentation.dto.TradeUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "교환 게시글", description = "가챠 교환 게시글 등록·조회·수정·삭제")
@RestController
@RequestMapping("/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;
    private final TradeCommentService tradeCommentService;

    @Operation(summary = "교환 게시글 등록")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(
                    mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                    encoding = @Encoding(name = "request", contentType = MediaType.APPLICATION_JSON_VALUE)
            )
    )
    @SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<TradeResponse>> createTrade(
            @Auth final Long memberId,
            @RequestPart("request") @Valid final TradeCreateRequest request,
            @Parameter(
                    description = "게시글 이미지. 목록의 썸네일은 첫 번째 사진을 사용한다.",
                    array = @ArraySchema(schema = @Schema(type = "string", format = "binary"))
            )
            @RequestPart(value = "images", required = false) final List<MultipartFile> images
    ) {
        TradeInfo tradeInfo = tradeService.createTrade(memberId, request.toCommand(), images);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(tradeInfo.tradeId())
                .toUri();

        return BaseResponse.created(location, TradeResponse.of(tradeInfo, 0));
    }

    @Operation(summary = "교환 게시글 목록 조회")
    @GetMapping
    public BaseResponse<Page<TradeSummaryResponse>> readTrades(
            @Parameter(description = "제목·설명 검색어", example = "산리오")
            @RequestParam(required = false) @Nullable final String keyword,
            @Parameter(description = "카테고리 ID 목록. 하나라도 포함하면 결과에 들어간다.", example = "1,3")
            @RequestParam(required = false) @Nullable final List<Long> categoryIds,
            @Parameter(description = "거래 상태", example = "AVAILABLE")
            @RequestParam(required = false) @Nullable final TradeStatus status,
            @ParameterObject
            @PageableDefault(sort = "createdAt", direction = Direction.DESC) final Pageable pageable
    ) {
        TradeSearchCondition condition = TradeSearchCondition.builder()
                .keyword(keyword)
                .categoryIds(categoryIds)
                .status(status)
                .build();
        Page<TradeSummaryInfo> trades = tradeService.findTrades(condition, pageable);

        return BaseResponse.ok(trades.map(TradeSummaryResponse::from));
    }

    @Operation(summary = "내 교환 게시글 목록 조회")
    @SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
    @GetMapping("/me")
    public BaseResponse<Page<TradeSummaryResponse>> readMemberTrades(
            @Auth final Long memberId,
            @Parameter(description = "거래 상태로 필터링. 생략하면 전체를 조회한다.", example = "AVAILABLE")
            @RequestParam(required = false) final TradeStatus status,
            @ParameterObject
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) final Pageable pageable
    ) {
        Page<TradeSummaryInfo> tradeInfos = tradeService.findAllByMemberId(memberId, status, pageable);
        return BaseResponse.ok(tradeInfos.map(TradeSummaryResponse::from));
    }

    @Operation(summary = "교환 게시글 상세 조회")
    @GetMapping("/{tradeId}")
    public BaseResponse<TradeResponse> readTrade(
            @Parameter(description = "교환 게시글 ID", example = "1") @PathVariable final Long tradeId
    ) {
        TradeDetailInfo detail = tradeCommentService.findTradeDetail(tradeId);

        return BaseResponse.ok(TradeResponse.of(detail.trade(), detail.commentCount()));
    }

    /**
     * 수정 화면이 기존 값이 채워진 폼을 통째로 제출하는 흐름이라 부분 수정이 아닌 전체 교체(PUT)로 받는다.
     * 단 이미지는 예외로, images 를 보내면 전체 교체하고 보내지 않으면 기존 이미지를 유지한다.
     */
    @Operation(summary = "교환 게시글 수정")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(
                    mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                    encoding = @Encoding(name = "request", contentType = MediaType.APPLICATION_JSON_VALUE)
            )
    )
    @SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
    @PutMapping(value = "/{tradeId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<TradeResponse> updateTrade(
            @Auth final Long memberId,
            @Parameter(description = "교환 게시글 ID", example = "1") @PathVariable final Long tradeId,
            @RequestPart("request") @Valid final TradeUpdateRequest request,
            @Parameter(
                    description = "교체할 이미지. 생략하면 기존 이미지를 유지한다.",
                    array = @ArraySchema(schema = @Schema(type = "string", format = "binary"))
            )
            @RequestPart(value = "images", required = false) final List<MultipartFile> images
    ) {
        TradeInfo tradeInfo = tradeService.updateTrade(memberId, tradeId, request.toCommand(), images);

        return BaseResponse.updated(TradeResponse.of(tradeInfo, tradeCommentService.countComments(tradeId)));
    }

    @Operation(summary = "교환 게시글 상태 변경")
    @SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
    @PatchMapping("/{tradeId}/status")
    public BaseResponse<TradeResponse> updateTradeStatus(
            @Auth final Long memberId,
            @Parameter(description = "교환 게시글 ID", example = "1") @PathVariable final Long tradeId,
            @RequestBody @Valid final TradeStatusUpdateRequest request
    ) {
        TradeInfo tradeInfo = tradeService.changeStatus(memberId, tradeId, request.status());

        return BaseResponse.updated(TradeResponse.of(tradeInfo, tradeCommentService.countComments(tradeId)));
    }

    @Operation(summary = "교환 게시글 삭제")
    @SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
    @DeleteMapping("/{tradeId}")
    public BaseResponse<Void> deleteTrade(
            @Auth final Long memberId,
            @Parameter(description = "교환 게시글 ID", example = "1") @PathVariable final Long tradeId
    ) {
        tradeService.removeTrade(memberId, tradeId);

        return BaseResponse.deleted(null);
    }
}
