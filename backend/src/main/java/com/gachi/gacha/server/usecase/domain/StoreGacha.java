package com.gachi.gacha.server.usecase.domain;

import com.gachi.gacha.server.gacha.domain.Gacha;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Table(
        name = "store_gacha",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_store_gacha_gacha_store",
                columnNames = {"gacha_id", "store_id"}
        )
)
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreGacha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gacha_id", nullable = false)
    private Gacha gacha;
}
