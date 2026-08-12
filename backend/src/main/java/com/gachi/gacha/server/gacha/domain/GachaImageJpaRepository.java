package com.gachi.gacha.server.gacha.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.gacha.domain.exception.GachaImageNotFoundException;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GachaImageJpaRepository extends JpaRepository<GachaImage, Long> {

    default GachaImage getByIdAndGachaId(@NonNull final Long imageId, @NonNull final Long gachaId) {
        return findByIdAndGachaId(imageId, gachaId)
                .orElseThrow(() -> new GachaImageNotFoundException(ErrorCode.GACHA_IMAGE_NOT_FOUND));
    }

    List<GachaImage> findAllByGachaId(final Long gachaId);

    Optional<GachaImage> findByIdAndGachaId(final Long imageId, final Long gachaId);

    void deleteAllByGachaId(final Long gachaId);
}
