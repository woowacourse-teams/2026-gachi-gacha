package com.gachi.gacha.server.store.domain;

import static com.gachi.gacha.server.common.util.BaseUtils.valueOrCurrent;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.common.util.GeometryUtils;
import com.gachi.gacha.server.store.domain.exception.InvalidStoreException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String thumbnailUrl;

    private String name;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @Column(columnDefinition = "GEOMETRY(Point, 4326)")
    private Point location;

    @Builder
    private Store(
            final Long id,
            final String name,
            final String thumbnailUrl,
            final Double latitude,
            final Double longitude
    ) {
        validateCoordinates(latitude, longitude);

        this.id = id;
        this.name = name;
        this.thumbnailUrl = thumbnailUrl;
        this.latitude = latitude;
        this.longitude = longitude;
        this.location = GeometryUtils.createPoint(latitude, longitude);
    }

    public Store patch(
            final String name,
            final String thumbnailUrl,
            final Double latitude,
            final Double longitude
    ) {

        return Store.builder()
                .id(id)
                .name(valueOrCurrent(name, this.name))
                .thumbnailUrl(valueOrCurrent(thumbnailUrl, this.thumbnailUrl))
                .latitude(valueOrCurrent(latitude, this.latitude))
                .longitude(valueOrCurrent(longitude, this.longitude))
                .build();
    }

    @PrePersist
    @PreUpdate
    private void updateLocation() {
        if (this.latitude != null && this.longitude != null) {
            this.location = GeometryUtils.createPoint(this.latitude, this.longitude);
        }
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
