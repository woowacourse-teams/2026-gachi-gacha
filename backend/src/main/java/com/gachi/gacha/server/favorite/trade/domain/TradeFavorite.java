package com.gachi.gacha.server.favorite.trade.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.trade.domain.Trade;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_trade_favorite_member_trade",
                        columnNames = {"member_id", "trade_id"}
                )

        },
        indexes = {
                @Index(
                        name = "idx_trade_favorite_trade",
                        columnList= "trade_id"
                )
        }
)
public class TradeFavorite extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trade_id", nullable = false)
    private Trade trade;

    public static TradeFavorite of(final Member member, final Trade trade) {
        TradeFavorite favorite = new TradeFavorite();
        favorite.member = member;
        favorite.trade = trade;
        return favorite;
    }
}
