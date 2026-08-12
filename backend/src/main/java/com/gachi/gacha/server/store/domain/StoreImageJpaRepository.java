package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreImageJpaRepository extends JpaRepository<StoreImage, Long> {

    List<StoreImage> findAllByStoreId(final Long storeId);

    void deleteAllByStoreId(final Long storeId);

    Optional<StoreImage> findByIdAndStoreId(final Long imageId, final Long storeId);

    default StoreImage getByIdAndStoreId(@NonNull final Long imageId, @NonNull final Long storeId) {
        return findByIdAndStoreId(imageId, storeId)
                .orElseThrow(() -> new StoreImageNotFoundException(ErrorCode.STORE_IMAGE_NOT_FOUND));
    }
}
