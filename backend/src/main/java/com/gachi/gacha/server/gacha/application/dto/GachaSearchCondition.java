package com.gachi.gacha.server.gacha.application.dto;

import java.util.List;

public record GachaSearchCondition(
        String keyword,
        List<Long> categoryIds,
        Double lat,
        Double lon,
        Double distanceKm,
        int page,
        int size
) {}
