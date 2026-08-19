package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.store.domain.exception.StoreNotFoundException;
import java.util.List;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreJpaRepository extends JpaRepository<Store, Long> {

    default Store getById(@NonNull final Long storeId) {
        return findById(storeId).orElseThrow(() -> new StoreNotFoundException(ErrorCode.STORE_NOT_FOUND));
    }

    interface StoreWithDistance {
        Long getStoreId();
        String getThumbnailUrl();
        Double getLatitude();
        Double getLongitude();
        Double getDistance();
    }

    @Query(value = """
                SELECT
                    s.id AS storeId,
                    s.thumbnail_url AS thumbnailUrl,
                    s.latitude AS latitude,
                    s.longitude AS longitude,
                    ST_DistanceSphere(
                       s.location,
                       ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
                   ) AS distance
                FROM store s
                WHERE ST_DWithin(
                   s.location::geography,
                   ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                   :radius
                )
                ORDER BY distance ASC, s.id ASC
            """, nativeQuery = true)
    List<StoreWithDistance> findNearbyStores(
            @Param("latitude") final Double latitude,
            @Param("longitude") final Double longitude,
            @Param("radius") final Integer radius
    );

    @Override
    Page<Store> findAll(final Pageable pageable);
}
