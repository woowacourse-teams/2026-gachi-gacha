package com.gachi.gacha.server.trade.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.trade.application.TradeService;
import com.gachi.gacha.server.trade.application.dto.TradeInfo;
import com.gachi.gacha.server.trade.application.dto.TradeSearchCondition;
import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import com.gachi.gacha.server.trade.presentation.dto.TradeCreateRequest;
import com.gachi.gacha.server.trade.presentation.dto.TradeResponse;
import com.gachi.gacha.server.trade.presentation.dto.TradeStatusUpdateRequest;
import com.gachi.gacha.server.trade.presentation.dto.TradeSummaryResponse;
import com.gachi.gacha.server.trade.presentation.dto.TradeUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
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

@RestController
@RequestMapping("/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<TradeResponse>> createTrade(
            @Auth final Long memberId,
            @RequestPart("request") @Valid final TradeCreateRequest request,
            @RequestPart(value = "images", required = false) final List<MultipartFile> images
    ) {
        TradeInfo tradeInfo = tradeService.createTrade(memberId, request.toCommand(), images);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(tradeInfo.tradeId())
                .toUri();

        return BaseResponse.created(location, TradeResponse.from(tradeInfo));
    }

    @GetMapping
    public BaseResponse<Page<TradeSummaryResponse>> readTrades(
            @RequestParam(required = false) @Nullable final String keyword,
            @RequestParam(required = false) @Nullable final List<Long> categoryIds,
            @RequestParam(required = false) @Nullable final TradeStatus status,
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

    @GetMapping("/{tradeId}")
    public BaseResponse<TradeResponse> readTrade(@PathVariable final Long tradeId) {
        TradeInfo tradeInfo = tradeService.findTrade(tradeId);

        return BaseResponse.ok(TradeResponse.from(tradeInfo));
    }

    /**
     * 수정 화면이 기존 값이 채워진 폼을 통째로 제출하는 흐름이라 부분 수정이 아닌 전체 교체(PUT)로 받는다.
     * 단 이미지는 예외로, images 를 보내면 전체 교체하고 보내지 않으면 기존 이미지를 유지한다.
     */
    @PutMapping(value = "/{tradeId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<TradeResponse> updateTrade(
            @Auth final Long memberId,
            @PathVariable final Long tradeId,
            @RequestPart("request") @Valid final TradeUpdateRequest request,
            @RequestPart(value = "images", required = false) final List<MultipartFile> images
    ) {
        TradeInfo tradeInfo = tradeService.updateTrade(memberId, tradeId, request.toCommand(), images);

        return BaseResponse.updated(TradeResponse.from(tradeInfo));
    }

    @PatchMapping("/{tradeId}/status")
    public BaseResponse<TradeResponse> updateTradeStatus(
            @Auth final Long memberId,
            @PathVariable final Long tradeId,
            @RequestBody @Valid final TradeStatusUpdateRequest request
    ) {
        TradeInfo tradeInfo = tradeService.changeStatus(memberId, tradeId, request.status());

        return BaseResponse.updated(TradeResponse.from(tradeInfo));
    }

    @DeleteMapping("/{tradeId}")
    public BaseResponse<Void> deleteTrade(@Auth final Long memberId, @PathVariable final Long tradeId) {
        tradeService.removeTrade(memberId, tradeId);

        return BaseResponse.deleted(null);
    }
}
