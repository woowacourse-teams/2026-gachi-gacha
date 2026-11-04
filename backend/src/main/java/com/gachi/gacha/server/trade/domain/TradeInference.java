package com.gachi.gacha.server.trade.domain;

import com.gachi.gacha.server.gacha.domain.Gacha;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 시스템이 교환글 텍스트로 추론한 결과. 사용자가 입력한 값(TradeCategory 등)과 섞지 않는다.
 * 행이 없으면 "아직 추론되지 않은 글"로 본다.
 * V23 테이블에 created_at/updated_at 이 없으므로 BaseTimeEntity 를 상속하지 않는다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TradeInference {

    @Id
    @Column(name = "trade_id")
    private Long tradeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inferred_gacha_id")
    private Gacha inferredGacha;

    private Double score;

    @Column(nullable = false)
    private LocalDateTime inferredAt;

    @ElementCollection
    @CollectionTable(name = "trade_inferred_category", joinColumns = @JoinColumn(name = "trade_id"))
    @Column(name = "category_id")
    private Set<Long> inferredCategoryIds = new HashSet<>();

    public static TradeInference of(
            final Long tradeId,
            final Gacha inferredGacha,
            final Double score,
            final Set<Long> inferredCategoryIds,
            final LocalDateTime inferredAt
    ) {
        TradeInference inference = new TradeInference();
        inference.tradeId = tradeId;
        inference.apply(inferredGacha, score, inferredCategoryIds, inferredAt);
        return inference;
    }

    /** 글이 수정되어 재추론할 때 결과를 통째로 교체한다. */
    public void update(
            final Gacha inferredGacha,
            final Double score,
            final Set<Long> inferredCategoryIds,
            final LocalDateTime inferredAt
    ) {
        apply(inferredGacha, score, inferredCategoryIds, inferredAt);
    }

    private void apply(
            final Gacha inferredGacha,
            final Double score,
            final Set<Long> inferredCategoryIds,
            final LocalDateTime inferredAt
    ) {
        this.inferredGacha = inferredGacha;
        this.score = score;
        this.inferredAt = inferredAt;
        this.inferredCategoryIds.clear();
        this.inferredCategoryIds.addAll(inferredCategoryIds);
    }
}
