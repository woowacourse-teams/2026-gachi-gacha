package com.gachi.gacha.server.favorite.gacha.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.member.domain.Member;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "gacha_favorite", uniqueConstraints = @UniqueConstraint(
        name = "uk_gacha_favorite_member_gacha", columnNames = {"member_id", "gacha_id"}))
public class GachaFavorite extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gacha_id", nullable = false)
    private Gacha gacha;

    public static GachaFavorite of(final Member member, final Gacha gacha) {
        GachaFavorite favorite = new GachaFavorite();
        favorite.member = member;
        favorite.gacha = gacha;
        return favorite;
    }
}
