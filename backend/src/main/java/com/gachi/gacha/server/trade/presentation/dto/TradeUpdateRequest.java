package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.TradeUpdateCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

/**
 * 전체 교체(PUT) 요청이라 등록과 같은 필드 구성을 가진다. 보내지 않은 선택 필드는 {@code null}로 덮어써진다.
 */
@Builder
public record TradeUpdateRequest(
        @NotBlank
        @Size(max = 255)
        String title,

        List<Long> categoryIds,

        String description,

        @Size(max = 255)
        String desiredProduction,

        @Size(max = 255)
        String purchaseStoreAddress,

        @Size(max = 255)
        String tradePlace,

        LocalDateTime availableTime
) {
    public TradeUpdateCommand toCommand() {
        return TradeUpdateCommand.builder()
                .title(title)
                .categoryIds(categoryIds)
                .description(description)
                .desiredProduction(desiredProduction)
                .purchaseStoreAddress(purchaseStoreAddress)
                .tradePlace(tradePlace)
                .availableTime(availableTime)
                .build();
    }
}
