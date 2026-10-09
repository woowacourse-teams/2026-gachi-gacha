package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.category.domain.Category;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaCategory;
import com.gachi.gacha.server.store.domain.Store;
import java.time.LocalDateTime;
import java.util.List;

public record GachaDocument(
        Long id,
        String name,
        String caption,
        String thumbnailUrl,
        List<Long> categoryIds,
        List<String> categoryNames,
        List<Long> storeIds,
        List<Location> locations,
        int storeCount,
        String source,
        LocalDateTime createdAt
) {
    public record Location(double lat, double lon) {}

    public static GachaDocument of(Gacha gacha, List<Store> stores) {
        var categories = gacha.getGachaCategories().stream()
                .map(GachaCategory::getCategory).toList();

        return new GachaDocument(
                gacha.getId(),
                gacha.getName(),
                gacha.getCaption(),
                gacha.getThumbnailUrl(),
                categories.stream().map(Category::getId).toList(),
                categories.stream().map(Category::getName).toList(),
                stores.stream().map(Store::getId).toList(),
                stores.stream().map(s -> new Location(s.getLatitude(), s.getLongitude())).toList(),
                stores.size(),
                gacha.getSource().name(),
                gacha.getCreatedAt()
        );
    }
}
