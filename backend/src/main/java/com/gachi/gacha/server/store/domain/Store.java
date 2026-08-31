package com.gachi.gacha.server.store.domain;

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

    private static final int MIN_LATITUDE = -90;
    private static final int MAX_LATITUDE = 90;
    private static final int MIN_LONGITUDE = -180;
    private static final int MAX_LONGITUDE = 180;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String thumbnailUrl;

    @NotNull
    @Column(nullable = false, length = 255)
    private String name;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @Column(columnDefinition = "GEOMETRY(Point, 4326)")
    private Point location;

    @NotNull
    @Column(nullable = false, length = 255)
    private String address;

    private Integer floor;

    @Column(length = 255)
    private String unit;

    @Builder
    private Store(
            final Long id,
            final String name,
            final String thumbnailUrl,
            final Double latitude,
            final Double longitude,
            final String address,
            final Integer floor,
            final String unit
    ) {
        validateRequired(name, address);
        validateCoordinates(latitude, longitude);
        validateFloor(floor);
        validateUnit(unit);

        this.id = id;
        this.name = name;
        this.thumbnailUrl = thumbnailUrl;
        this.latitude = latitude;
        this.longitude = longitude;
        this.location = GeometryUtils.createPoint(latitude, longitude);
        this.floor = floor;
        this.unit = unit;
        this.address = address;
    }

    @PrePersist
    @PreUpdate
    private void updateLocation() {
        if (this.latitude != null && this.longitude != null) {
            this.location = GeometryUtils.createPoint(this.latitude, this.longitude);
        }
    }

    private void validateCoordinates(final Double latitude, final Double longitude) {
        if (latitude == null || latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
            throw new InvalidStoreException();
        }
        if (longitude == null || longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
            throw new InvalidStoreException();
        }
    }

    private void validateRequired(final String name, final String address) {
        if (isBlank(name) || isBlank(address)) {
            throw new InvalidStoreException();
        }
    }

    private void validateFloor(final Integer floor) {
        if (floor != null && floor == 0) {
            throw new InvalidStoreException();
        }
    }

    private void validateUnit(final String unit) {
        if (unit != null && (unit.isBlank() || unit.length() > 255)) {
            throw new InvalidStoreException();
        }
    }

    private boolean isBlank(final String value) {
        return value == null || value.isBlank();
    }
}
