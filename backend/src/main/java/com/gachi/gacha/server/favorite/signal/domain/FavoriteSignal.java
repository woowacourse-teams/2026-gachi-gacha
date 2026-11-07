package com.gachi.gacha.server.favorite.signal.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_favorite_signal",
                        columnNames = {"member_id", "favorite_type", "target_id", "signal_type", "signal_value"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_favorite_signal_lookup",
                        columnList = "signal_type, signal_value, member_id"
                ),
                @Index(
                        name = "idx_favorite_signal_member",
                        columnList = "member_id"
                )
        }
)
public class FavoriteSignal extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(name = "favorite_type", nullable = false)
    private FavoriteType favoriteType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "signal_type", nullable = false)
    private SignalType signalType;

    @Column(name = "signal_value", nullable = false)
    private String signalValue;

    private Double weight;

    public static FavoriteSignal of(
            final Long memberId,
            final FavoriteType favoriteType,
            final Long targetId,
            final SignalType signalType,
            final String signalValue,
            final double weight,
            final LocalDateTime createdAt
    ) {
        FavoriteSignal signal = new FavoriteSignal();
        signal.memberId = memberId;
        signal.favoriteType = favoriteType;
        signal.targetId = targetId;
        signal.signalType = signalType;
        signal.signalValue = signalValue;
        signal.weight = weight;
        signal.setCreatedAt(createdAt);
        return signal;
    }
}
