package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.trade.domain.Place;
import lombok.Builder;

@Builder
public record PlaceCommand(
        String name,
        String address,
        Double latitude,
        Double longitude
) {
    public Place toPlace() {
        return new Place(name, address, latitude, longitude);
    }
}
