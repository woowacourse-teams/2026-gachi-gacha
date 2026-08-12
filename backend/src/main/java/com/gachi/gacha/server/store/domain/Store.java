package com.gachi.gacha.server.store.domain;

import static com.gachi.gacha.server.common.util.BaseUtils.valueOrCurrent;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.store.domain.exception.InvalidStoreException;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String thumbnailUrl;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @Builder
    private Store(
            final Long id,
            final String thumbnailUrl,
            final Double latitude,
            final Double longitude
    ) {
        validateCoordinates(latitude, longitude);

        this.id = id;
        this.thumbnailUrl = thumbnailUrl;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Store patch(
            final String thumbnailUrl,
            final Double latitude,
            final Double longitude
    ) {

        return Store.builder()
                .id(id)
                .thumbnailUrl(valueOrCurrent(thumbnailUrl, this.thumbnailUrl))
                .latitude(valueOrCurrent(latitude, this.latitude))
                .longitude(valueOrCurrent(longitude, this.longitude))
                .build();
    }

    private void validateCoordinates(final Double latitude, final Double longitude) {
        if (latitude == null || latitude < -90 || latitude > 90) {
            throw new InvalidStoreException();
        }
        if (longitude == null || longitude < -180 || longitude > 180) {
            throw new InvalidStoreException();
        }
    }
}
