package com.gachi.gacha.server.favorite.signal.application;

import com.gachi.gacha.server.favorite.signal.domain.SignalType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 교환글 하나를 관심 신호 목록으로 바꾸는 순수 함수. 찜 쪽과 새 글 쪽이 반드시 같은 규칙을 써야 매칭이 어긋나지 않는다.
 *
 * 가중치: 카테고리 신호 전체가 categoryWeight(0.6), 키워드 신호 전체가 keywordWeight(0.4)를 균등 분배한다.
 * 한쪽 신호가 없어도 다른 쪽으로 몰아주지 않는다. 신호가 부족한 글은 그만큼 영향이 작아야 하기 때문이다.
 */
public final class TradeSignalExtractor {

    private TradeSignalExtractor() {
    }

    public record SignalItem(SignalType type, String value, double weight) {
    }

    public static List<SignalItem> extract(
            final Collection<Long> userCategoryIds,
            final Collection<Long> inferredCategoryIds,
            final Double inferenceScore,
            final double acceptScore,
            final Collection<String> keywords,
            final double categoryWeight,
            final double keywordWeight
    ) {
        List<SignalItem> items = new ArrayList<>();

        Map<Long, Double> categories = CategorySignalExtractor.extract(
                userCategoryIds, inferredCategoryIds, inferenceScore, acceptScore);
        categories.forEach((categoryId, weight) ->
                items.add(new SignalItem(SignalType.CATEGORY, String.valueOf(categoryId), weight * categoryWeight)));

        if (keywords != null && !keywords.isEmpty()) {
            double each = keywordWeight / keywords.size();
            keywords.forEach(keyword -> items.add(new SignalItem(SignalType.KEYWORD, keyword, each)));
        }
        return items;
    }
}
