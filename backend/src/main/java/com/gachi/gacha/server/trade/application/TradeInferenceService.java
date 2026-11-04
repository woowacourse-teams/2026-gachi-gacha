package com.gachi.gacha.server.trade.application;

import com.gachi.gacha.server.gacha.application.dto.InferenceGacha;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.trade.application.dto.TradeInferenceSource;
import com.gachi.gacha.server.trade.domain.TradeInference;
import com.gachi.gacha.server.trade.domain.TradeInferenceJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.util.TradeKeywordCleaner;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * DB 접근만 담당한다. 각 메서드가 짧은 트랜잭션 하나이고, ES 호출은 하지 않는다.
 * 읽기 → ES 검색 → 저장의 순서는 TradeInferenceFacade 가 조합한다.
 */
@Service
@RequiredArgsConstructor
public class TradeInferenceService {

    private final GachaJpaRepository gachaJpaRepository;
    private final TradeJpaRepository tradeJpaRepository;
    private final TradeInferenceJpaRepository tradeInferenceJpaRepository;

    /** 추론에 필요한 값만 읽는다. 글이 이미 삭제됐으면 빈 Optional. */
    @Transactional(readOnly = true)
    public Optional<TradeInferenceSource> findSource(final Long tradeId) {
        return tradeJpaRepository.findById(tradeId)
                .map(trade -> new TradeInferenceSource(
                        TradeKeywordCleaner.clean(trade.getTitle()),
                        trade.getTradeCategories().stream()
                                .map(tradeCategory -> tradeCategory.getCategory().getId())
                                .toList(),
                        // ES 호출 전에 읽은 시각. 추론 중에 글이 수정되면 updatedAt > inferredAt 이 되어 다시 추론된다.
                        LocalDateTime.now()));
    }

    /** 추론 결과 저장. inferred 가 null 이면 "후보 없음"을 뜻하는 빈 결과를 저장한다. */
    @Transactional
    public void save(final Long tradeId, final LocalDateTime inferredAt, @Nullable final InferenceGacha inferred) {
        Gacha gacha = inferred != null ? gachaJpaRepository.getReferenceById(inferred.gachaId()) : null;
        Double score = inferred != null ? inferred.score() : null;
        Set<Long> categoryIds = inferred != null ? inferred.categoryIds() : Set.of();

        tradeInferenceJpaRepository.findById(tradeId).ifPresentOrElse(
                existing -> existing.update(gacha, score, categoryIds, inferredAt),
                () -> tradeInferenceJpaRepository.save(
                        TradeInference.of(tradeId, gacha, score, categoryIds, inferredAt))
        );
    }
}
