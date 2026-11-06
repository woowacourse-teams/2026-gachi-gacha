package com.gachi.gacha.server.favorite.signal.application;

import static com.gachi.gacha.server.favorite.signal.application.TradeSignalExtractor.SignalItem;

import com.gachi.gacha.server.favorite.signal.application.dto.TradeFavoriteCandidate;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignalJpaRepository;
import com.gachi.gacha.server.favorite.signal.domain.SignalType;
import com.gachi.gacha.server.trade.domain.Place;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeInference;
import com.gachi.gacha.server.trade.domain.TradeInferenceJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.util.TradeKeywordCleaner;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관심 signal을 비교해 새 교환글의 수신 후보를 높은 관련도 순서로 반환한다. */
@Service
@RequiredArgsConstructor
public class TradeFavoriteMatcher {

    private static final double CATEGORY_WEIGHT = 0.6;
    private static final double KEYWORD_WEIGHT = 0.4;
    private static final double INFERRED_GACHA_WEIGHT = 0.4;
    private static final double AREA_WEIGHT = 0.1;

    private final FavoriteSignalJpaRepository favoriteSignalJpaRepository;
    private final TradeJpaRepository tradeJpaRepository;
    private final TradeInferenceJpaRepository tradeInferenceJpaRepository;

    @Value("${favorite.signal.inference-accept-score:0.0}")
    private double inferenceAcceptScore;

    @Value("${favorite.signal.half-life-days:90.0}")
    private double halfLifeDays;

    /** 점수 = 새 글 feature 가중치 × 사용자 signal 가중치의 시간 감쇠 합. 글 작성자는 제외한다. */
    @Transactional(readOnly = true)
    public List<TradeFavoriteCandidate> findCandidates(final Long tradeId) {
        Trade trade = tradeJpaRepository.getByIdWithCategories(tradeId);
        TradeInference inference = tradeInferenceJpaRepository.findById(tradeId).orElse(null);

        List<SignalItem> features = buildFeatures(trade, inference);
        if (features.isEmpty()) {
            return List.of();
        }

        Map<SignalType, Map<String, Double>> featureWeights = groupWeightsByType(features);
        Map<Long, Double> scores = scoreMembers(featureWeights, trade);
        return toSortedCandidates(scores);
    }

    private List<SignalItem> buildFeatures(Trade trade, TradeInference inference) {
        Double inferenceScore = (inference == null) ? null : inference.getScore();
        List<SignalItem> features = new ArrayList<>(TradeSignalExtractor.extract(
                categoryIdsOf(trade),
                (inference == null) ? Set.of() : inference.getInferredCategoryIds(),
                inferenceScore,
                inferenceAcceptScore,
                keywordsOf(trade, inference),
                CATEGORY_WEIGHT,
                KEYWORD_WEIGHT
        ));

        if (isInferredGachaAccepted(inference, inferenceScore)) {
            features.add(new SignalItem(
                    SignalType.GACHA,
                    String.valueOf(inference.getInferredGacha().getId()),
                    INFERRED_GACHA_WEIGHT));
        }

        String area = areaOf(trade.getTradePlace());
        if (area != null) {
            features.add(new SignalItem(SignalType.AREA, area, AREA_WEIGHT));
        }
        return features;
    }

    private Set<Long> categoryIdsOf(Trade trade) {
        return trade.getTradeCategories().stream()
                .map(tradeCategory -> tradeCategory.getCategory().getId())
                .collect(Collectors.toSet());
    }

    private List<String> keywordsOf(Trade trade, TradeInference inference) {
        return (inference == null) || inference.getInferredKeywords().isEmpty()
                ? TradeKeywordCleaner.extractKeywords(trade.getTitle()).stream().sorted().toList()
                : inference.getInferredKeywords().stream().sorted().toList();
    }

    private boolean isInferredGachaAccepted(TradeInference inference, Double inferenceScore) {
        return inference != null
                && inference.getInferredGacha() != null
                && inferenceScore != null
                && inferenceScore >= inferenceAcceptScore;
    }

    /** 같은 타입·값의 feature는 가중치를 합쳐서 {타입 → {값 → 가중치}}로 묶는다. */
    private Map<SignalType, Map<String, Double>> groupWeightsByType(List<SignalItem> features) {
        return features.stream()
                .collect(Collectors.groupingBy(
                        SignalItem::type,
                        () -> new EnumMap<>(SignalType.class),
                        Collectors.toMap(SignalItem::value,
                                SignalItem::weight, Double::sum)));
    }

    private Map<Long, Double> scoreMembers(Map<SignalType, Map<String, Double>> featureWeights, Trade trade) {
        Map<Long, Double> scores = new LinkedHashMap<>();
        LocalDateTime now = LocalDateTime.now();
        featureWeights.forEach((type, weightsByValue) ->
                favoriteSignalJpaRepository.findMemberScores(
                                type.name(), weightsByValue.keySet(), now, halfLifeDays)
                        .forEach(match -> {
                            Long memberId = match.getMemberId();
                            if (!trade.getMember().getId().equals(memberId)) {
                                double contribution = weightsByValue.get(match.getSignalValue())
                                        * (match.getScore() != null ? match.getScore() : 0.0);
                                scores.merge(memberId, contribution, Double::sum);
                            }
                        }));
        return scores;
    }

    private List<TradeFavoriteCandidate> toSortedCandidates(Map<Long, Double> scores) {
        return scores.entrySet().stream()
                .filter(entry -> entry.getValue() > 0)
                .map(entry -> new TradeFavoriteCandidate(entry.getKey(), entry.getValue()))
                .sorted((left, right) -> Double.compare(right.interestScore(), left.interestScore()))
                .toList();
    }

    private String areaOf(final Place place) {
        if (place == null || place.getAddress() == null || place.getAddress().isBlank()) {
            return null;
        }
        String[] parts = place.getAddress().trim().split("\\s+");
        return parts.length >= 2 ? parts[0] + " " + parts[1] : parts[0];
    }
}
