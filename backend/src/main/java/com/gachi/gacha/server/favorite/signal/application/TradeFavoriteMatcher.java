package com.gachi.gacha.server.favorite.signal.application;

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

        Set<Long> userCategoryIds = trade.getTradeCategories().stream()
                .map(tradeCategory -> tradeCategory.getCategory().getId())
                .collect(Collectors.toSet());
        Set<Long> inferredCategoryIds = inference == null ? Set.of() : inference.getInferredCategoryIds();
        Double inferenceScore = inference == null ? null : inference.getScore();
        List<String> keywords = inference == null || inference.getInferredKeywords().isEmpty()
                ? TradeKeywordCleaner.extractKeywords(trade.getTitle()).stream().sorted().toList()
                : inference.getInferredKeywords().stream().sorted().toList();

        List<TradeSignalExtractor.SignalItem> features = new ArrayList<>(TradeSignalExtractor.extract(
                userCategoryIds,
                inferredCategoryIds,
                inferenceScore,
                inferenceAcceptScore,
                keywords,
                0.6,
                0.4
        ));
        if (inference != null && inference.getInferredGacha() != null
                && inferenceScore != null && inferenceScore >= inferenceAcceptScore) {
            features.add(new TradeSignalExtractor.SignalItem(
                    SignalType.GACHA, String.valueOf(inference.getInferredGacha().getId()), 0.4));
        }
        String area = areaOf(trade.getTradePlace());
        if (area != null) {
            features.add(new TradeSignalExtractor.SignalItem(SignalType.AREA, area, 0.1));
        }
        if (features.isEmpty()) {
            return List.of();
        }

        Map<Long, Double> scores = new LinkedHashMap<>();
        Map<SignalType, Map<String, Double>> featureWeights = features.stream()
                .collect(Collectors.groupingBy(
                        TradeSignalExtractor.SignalItem::type,
                        () -> new EnumMap<>(SignalType.class),
                        Collectors.toMap(TradeSignalExtractor.SignalItem::value,
                                TradeSignalExtractor.SignalItem::weight, Double::sum)));
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
