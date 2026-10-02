package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.TradeCreateCommand;
import com.gachi.gacha.server.trade.domain.Place;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Schema(
        description = """
                교환 게시글 등록 요청. multipart 의 `request` 파트에 JSON 으로 담아 보낸다.
                이미지는 같은 요청의 `images` 파트로 함께 보낸다."""
)
@Builder
public record TradeCreateRequest(
        @Schema(
                description = "제목",
                example = "산리오 쿠로미 인형 교환해요",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank
        @Size(max = 255)
        String title,

        @Schema(
                description = "카테고리 ID 목록. GET /categories 로 조회한 ID 를 넣는다.",
                example = "[1, 3]"
        )
        List<Long> categoryIds,

        @Schema(description = "상세 설명", example = "미개봉 상태입니다. 홍대에서 직거래 희망합니다.")
        String description,

        @Schema(description = "받고 싶은 물건", example = "포켓몬 피카츄 키링")
        @Size(max = 255)
        String desiredProduction,

        @Schema(description = "가챠를 뽑은 매장")
        @Valid
        PlaceRequest purchaseStore,

        @Schema(description = "교환을 희망하는 장소")
        @Valid
        PlaceRequest tradePlace,

        @Schema(
                description = "교환 가능 일시",
                example = "2026-10-05T14:00:00"
        )
        LocalDateTime availableTime
) {
    public TradeCreateCommand toCommand() {
        return TradeCreateCommand.builder()
                .title(title)
                .categoryIds(categoryIds)
                .description(description)
                .desiredProduction(desiredProduction)
                .purchaseStore(toPlace(purchaseStore))
                .tradePlace(toPlace(tradePlace))
                .availableTime(availableTime)
                .build();
    }

    private Place toPlace(final PlaceRequest placeRequest) {
        if (placeRequest == null) {
            return null;
        }
        return placeRequest.toPlace();
    }
}
