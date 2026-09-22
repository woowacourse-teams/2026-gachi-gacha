package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.TradeCreateCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeCreateRequest(
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
    public TradeCreateCommand toCommand() {
        return TradeCreateCommand.builder()
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
