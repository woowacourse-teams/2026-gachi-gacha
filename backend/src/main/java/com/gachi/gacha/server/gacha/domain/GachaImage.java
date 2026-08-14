package com.gachi.gacha.server.gacha.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.gacha.domain.exception.GachaImageInvalidValueException;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Entity
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GachaImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gacha_id", nullable = false)
    private Gacha gacha;

    @NotNull
    private String imageUrl;

    public GachaImage(final Gacha gacha, final String imageUrl) {
        this.gacha = gacha;
        this.imageUrl = imageUrl;
    }

    public void changeImageUrl(final String newImageUrl) {
        if (newImageUrl == null) {
            throw new GachaImageInvalidValueException(ErrorCode.INVALID_GACHA_IMAGE_POLICY);
        }
        this.imageUrl = newImageUrl;
    }
}
