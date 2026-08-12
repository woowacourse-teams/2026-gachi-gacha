package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.store.domain.exception.InvalidStoreException;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
public class Store extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String thumbnailUrl;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    public void modify(
            final String thumbnailUrl,
            final Double latitude,
            final Double longitude
    ) {
        Double nextLatitude = latitude == null ? this.latitude : latitude;
        Double nextLongitude = longitude == null ? this.longitude : longitude;
        validateCoordinates(nextLatitude, nextLongitude);

        if (thumbnailUrl != null) {
            this.thumbnailUrl = thumbnailUrl;
        }
        this.latitude = nextLatitude;
        this.longitude = nextLongitude;
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
