package com.gachi.gacha.server.gacha.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.gacha.domain.exception.GachaNotFoundException;
import java.util.List;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GachaJpaRepository extends JpaRepository<Gacha, Long> {

    default Gacha getById(@NonNull final Long gachaId) {
        return findById(gachaId).orElseThrow(() -> new GachaNotFoundException(ErrorCode.GACHA_NOT_FOUND));
    }

    Page<Gacha> findByNameContaining(final String keyword, final Pageable pageable);

    List<String> findInstagramMediaIdByInstagramMediaIdIn(final List<String> instagramMediaIds);
}
