package com.gachi.gacha.server.favorite.signal.application;

import com.gachi.gacha.server.favorite.signal.domain.FavoriteType;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Coordinates signal rebuilds for the same favorite across threads and application instances. */
@Component
@RequiredArgsConstructor
public class FavoriteSignalAdvisoryLock {

    private final EntityManager entityManager;

    @Transactional(propagation = Propagation.MANDATORY)
    public void acquire(final Long memberId, final FavoriteType favoriteType, final Long targetId) {
        String lockKey = memberId + ":" + favoriteType.name() + ":" + targetId;
        entityManager.createNativeQuery("select pg_advisory_xact_lock(hashtextextended(?1, 0))")
                .setParameter(1, lockKey)
                .getSingleResult();
    }
}
