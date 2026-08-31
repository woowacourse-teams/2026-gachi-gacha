package com.gachi.gacha.server.gacha.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "gacha",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_gacha_source_product_code",
                columnNames = {"source", "product_code"}
        )
)
@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Gacha extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(length = 1000)
    private String thumbnailUrl;

    @Column(unique = true, name = "instagram_media_id")
    private String instagramMediaId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CollectionSource source = CollectionSource.MANUAL;

    @Column(name = "product_code", length = 255)
    private String productCode;

    @Builder.Default
    @OneToMany(mappedBy = "gacha", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GachaCategory> gachaCategories = new ArrayList<>();
}
