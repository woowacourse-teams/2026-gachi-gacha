package com.gachi.gacha.server.trade.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.gacha.domain.Category;
import com.gachi.gacha.server.trade.domain.exception.InvalidTradeException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Trade extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String desiredExchange;

    @Column(length = 255)
    private String purchaseStore;

    @Column(length = 255)
    private String tradePlace;

    private LocalDateTime availableTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TradeStatus status;

    @Builder
    private Trade(
            final Long id,
            final Long memberId,
            final Category category,
            final String title,
            final String description,
            final String desiredExchange,
            final String purchaseStore,
            final String tradePlace,
            final LocalDateTime availableTime,
            final TradeStatus status
    ) {
        validateRequired(memberId, category, title);

        this.id = id;
        this.memberId = memberId;
        this.category = category;
        this.title = title;
        this.description = description;
        this.desiredExchange = desiredExchange;
        this.purchaseStore = purchaseStore;
        this.tradePlace = tradePlace;
        this.availableTime = availableTime;
        this.status = status != null ? status : TradeStatus.AVAILABLE;
    }

    private void validateRequired(final Long memberId, final Category category, final String title) {
        if (memberId == null) {
            throw new InvalidTradeException(ErrorCode.INVALID_TRADE_POLICY);
        }
        if (category == null) {
            throw new InvalidTradeException(ErrorCode.INVALID_TRADE_POLICY);
        }
        if (title == null || title.isBlank() || title.length() > 255) {
            throw new InvalidTradeException(ErrorCode.INVALID_TRADE_POLICY);
        }
    }
}
