package com.gachi.gacha.server.favorite.signal.domain;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * 찜한 대상(또는 새 교환글)을 "카테고리 신호"로 바꾸는 순수 함수. DB, ES 에 접근하지 않는다.
 * 찜 쪽과 새 글 쪽이 반드시 같은 규칙을 써야 매칭이 어긋나지 않는다.
 *
 * 규칙: 사용자가 입력한 카테고리가 있으면 그것을 쓰고, 없으면 신뢰할 수 있는 추론 카테고리를 쓴다.
 * 대상 하나가 만드는 가중치의 합은 항상 1.0 이다(카테고리가 많은 글이 과하게 걸리는 것을 막는다).
 */
public final class CategorySignalExtractor {

    private CategorySignalExtractor() {
    }

    /**
     * @param userCategoryIds     사용자가 입력한 카테고리 (null 또는 빈 값 가능)
     * @param inferredCategoryIds 추론된 카테고리 (null 또는 빈 값 가능)
     * @param inferenceScore      추론 점수 (ES 원점수, null 가능)
     * @param acceptScore         이 점수 이상일 때만 추론 결과를 신호로 쓴다
     * @return 카테고리 ID -> 가중치. 신호가 없으면 빈 맵
     */
    public static Map<Long, Double> extract(
            final Collection<Long> userCategoryIds,
            final Collection<Long> inferredCategoryIds,
            final Double inferenceScore,
            final double acceptScore
    ) {
        Set<Long> chosen = choose(userCategoryIds, inferredCategoryIds, inferenceScore, acceptScore);
        if (chosen.isEmpty()) {
            return Map.of();
        }
        double weight = 1.0 / chosen.size();
        Map<Long, Double> weights = new LinkedHashMap<>();
        chosen.forEach(categoryId -> weights.put(categoryId, weight));
        return weights;
    }

    /**
     *
     * @param userCategoryIds
     * @param inferredCategoryIds
     * @param inferenceScore
     * @param acceptScore
     * @return 사용자 카테고리가 있으면 사용자 카테고리를 사용, 없으면 추론 카테고리 사용
     */
    private static Set<Long> choose(
            final Collection<Long> userCategoryIds,
            final Collection<Long> inferredCategoryIds,
            final Double inferenceScore,
            final double acceptScore
    ) {
        if (userCategoryIds != null && !userCategoryIds.isEmpty()) {
            return new LinkedHashSet<>(userCategoryIds);
        }
        boolean accepted = (inferredCategoryIds != null)
                && !inferredCategoryIds.isEmpty()
                && inferenceScore != null
                && inferenceScore >= acceptScore;
        return accepted ? new LinkedHashSet<>(inferredCategoryIds) : Set.of();
    }
}
