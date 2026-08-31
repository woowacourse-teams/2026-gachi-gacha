package com.gachi.gacha.server.gacha.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.gacha.domain.exception.GachaNotFoundException;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GachaJpaRepository extends JpaRepository<Gacha, Long> {

    default Gacha getById(@NonNull final Long gachaId) {
        return findByIdWithCategories(gachaId).orElseThrow(() -> new GachaNotFoundException(ErrorCode.GACHA_NOT_FOUND));
    }

    @Query("SELECT g FROM Gacha g " +
            "LEFT JOIN FETCH g.gachaCategories gc " +
            "LEFT JOIN FETCH gc.category c " +
            "WHERE g.id = :id")
    Optional<Gacha> findByIdWithCategories(@Param("id") final Long id);

    @Query("SELECT g.id FROM Gacha g")
    Page<Long> findGachaIds(final Pageable pageable);

    @Query(value = "SELECT g.id FROM Gacha g WHERE g.name LIKE %:keyword%",
            countQuery = "SELECT COUNT(g) FROM Gacha g WHERE g.name LIKE %:keyword%")
    Page<Long> findGachaIdsByNameContaining(@Param("keyword") final String keyword, final Pageable pageable);

    @Query("SELECT DISTINCT g FROM Gacha g " +
            "LEFT JOIN FETCH g.gachaCategories gc " +
            "LEFT JOIN FETCH gc.category c " +
            "WHERE g.id IN :ids")
    List<Gacha> findByIdsWithCategories(@Param("ids") final List<Long> ids);


}
