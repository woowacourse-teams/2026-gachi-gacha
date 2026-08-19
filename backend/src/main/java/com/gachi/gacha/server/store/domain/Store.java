package com.gachi.gacha.server.store.domain;

import static com.gachi.gacha.server.common.util.BaseUtils.valueOrCurrent;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
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
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store extends BaseTimeEntity {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String thumbnailUrl;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @Column(columnDefinition = "GEOMETRY(Point, 4326)")
    private Point location;

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
        this.location = createPoint(latitude, longitude);
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

    private Point createPoint(final Double latitude, final Double longitude) {
        if (latitude == null || longitude == null) {
            return null;
        }
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(4326); // WGS84 좌표계 지정
        return point;
    }

    @PrePersist
    @PreUpdate
    private void updateLocation() {
        if (this.latitude != null && this.longitude != null) {
            this.location = createPoint(this.latitude, this.longitude);
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
