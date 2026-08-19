package com.gachi.gacha.server.gacha.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Gacha extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(length = 1000)
    private String thumbnailUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GachaStatus status = GachaStatus.PENDING;

    @Column(unique = true, name = "instagram_media_id")
    private String instagramMediaId;

    public void update(final String name, final String caption, final String thumbnailUrl) {
        validateName(name);
        this.name = name;
        this.caption = caption;
        this.thumbnailUrl = thumbnailUrl;
    }

    public void approve(final String name) {
        this.status = GachaStatus.APPROVED;
        this.name = name;
    }

    public void reject() {
        this.status = GachaStatus.REJECTED;
    }

    private void validateName(final String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_GACHA_POLICY);
        }
    }
}
