package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.PlaceCommand;
import com.gachi.gacha.server.trade.application.dto.TradeCreateCommand;
import jakarta.validation.Valid;
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

        @Valid
        PlaceRequest purchaseStore,

        @Valid
        PlaceRequest tradePlace,

        LocalDateTime availableTime
) {
    public TradeCreateCommand toCommand() {
        return TradeCreateCommand.builder()
                .title(title)
                .categoryIds(categoryIds)
                .description(description)
                .desiredProduction(desiredProduction)
                .purchaseStore(toCommand(purchaseStore))
                .tradePlace(toCommand(tradePlace))
                .availableTime(availableTime)
                .build();
    }

    /**
     * 장소는 선택값이라, 보내지 않으면 {@code null}을 그대로 넘겨 "장소 없음"으로 저장한다.
     */
    private PlaceCommand toCommand(final PlaceRequest placeRequest) {
        if (placeRequest == null) {
            return null;
        }
        return placeRequest.toCommand();
    }
}
