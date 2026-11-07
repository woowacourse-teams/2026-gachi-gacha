package com.gachi.gacha.server.favorite.store.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.store.domain.Store;
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
@Table(name = "store_favorite", uniqueConstraints = @UniqueConstraint(
        name = "uk_store_favorite_member_store", columnNames = {"member_id", "store_id"}))
public class StoreFavorite extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    public static StoreFavorite of(final Member member, final Store store) {
        StoreFavorite favorite = new StoreFavorite();
        favorite.member = member;
        favorite.store = store;
        return favorite;
    }
}
