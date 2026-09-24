package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.Place;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record PlaceRequest(
        @Size(max = 255)
        @Nullable String name,

        @NotBlank
        @Size(max = 255)
        String address,

        @NotNull
        Double latitude,

        @NotNull
        Double longitude
) {
    public Place toPlace() {
        return new Place(name, address, latitude, longitude);
    }
}
