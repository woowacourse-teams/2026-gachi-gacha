package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.Place;
import com.gachi.gacha.server.trade.application.dto.TradeUpdateCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeUpdateRequest(
        @NotBlank
        @Size(max = 255)
        String title,

        List<Long> categoryIds,

        String description,

        @Size(max = 255)
        String desiredProduction,

        @Valid
        PlaceRequest purchaseStore,

        @Valid
        PlaceRequest tradePlace,

        LocalDateTime availableTime
) {
    public TradeUpdateCommand toCommand() {
        return TradeUpdateCommand.builder()
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
