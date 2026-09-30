package com.gachi.gacha.server.gacha.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.gacha.domain.exception.GachaNotFoundException;
import com.gachi.gacha.server.usecase.domain.StoreGachaCount;
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

    @Query("SELECT DISTINCT g FROM Gacha g JOIN g.gachaCategories gc WHERE gc.category.id IN :categoryIds")
    Page<Gacha> findByCategoryIds(@Param("categoryIds") List<Long> categoryIds, Pageable pageable);

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

    @Query(value = """
        SELECT g.id AS gachaId, COUNT(sg.store_id) AS storeCount
        FROM gacha g
        LEFT JOIN store_gacha sg ON sg.gacha_id = g.id
        WHERE EXISTS (
            SELECT 1 FROM gacha_category gc
            WHERE gc.gacha_id = g.id AND gc.category_id IN (:categoryIds)
        )
        GROUP BY g.id
        ORDER BY storeCount DESC, g.id ASC
        """,
            countQuery = """
        SELECT COUNT(*)
        FROM gacha g
        WHERE EXISTS (
            SELECT 1 FROM gacha_category gc
            WHERE gc.gacha_id = g.id AND gc.category_id IN (:categoryIds)
        )
        """,
            nativeQuery = true)
    Page<StoreGachaCount> findGachaIdsOrderByStoreCount(@Param("categoryIds") List<Long> categoryIds, Pageable pageable);
}
