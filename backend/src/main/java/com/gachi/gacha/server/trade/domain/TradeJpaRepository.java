package com.gachi.gacha.server.trade.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.trade.domain.exception.TradeNotFoundException;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * {@link JpaSpecificationExecutor}를 함께 상속하는 이유는 목록 조회 때문이다. keyword / categoryIds / status가
 * 모두 선택값이라 {@code @Query}로 쓰면 같은 WHERE 절이 네 벌로 복사되므로, 필터 조립은
 * {@link TradeSpecifications}에 맡기고 여기서는 {@code findAll(Specification, Pageable)}을 쓴다.
 * 자세한 근거는 {@link TradeSpecifications} 주석 참고.
 */
@Repository
public interface TradeJpaRepository extends JpaRepository<Trade, Long>, JpaSpecificationExecutor<Trade> {

    default Trade getById(@NonNull final Long tradeId) {
        return findById(tradeId).orElseThrow(() -> new TradeNotFoundException(ErrorCode.TRADE_NOT_FOUND));
    }

    default Trade getByIdWithCategories(@NonNull final Long tradeId) {
        return findByIdWithCategories(tradeId).orElseThrow(() -> new TradeNotFoundException(ErrorCode.TRADE_NOT_FOUND));
    }

    List<Trade> findAllByMemberId(final Long memberId);

    List<Trade> findAllByMemberIdAndStatus(Long memberId, TradeStatus status);

    @Query("SELECT t FROM Trade t " +
            "LEFT JOIN FETCH t.tradeCategories tc " +
            "LEFT JOIN FETCH tc.category c " +
            "WHERE t.id = :id")
    Optional<Trade> findByIdWithCategories(@Param("id") final Long id);

    /**
     * 목록 조회에서 카테고리 N+1을 막기 위해, 이미 페이징이 끝난 ID들만 카테고리와 함께 다시 가져온다.
     * <p>
     * 이 쿼리에 직접 {@code Pageable}을 넘기면 안 된다. 컬렉션을 fetch join 한 상태로 페이징하면 Hibernate가
     * 조건에 맞는 행을 전부 메모리에 올린 뒤 잘라내기 때문이다(HHH000104). 그래서 페이징은 앞단에서 끝내고
     * 이 쿼리는 "정해진 ID 목록을 채워 넣는" 역할만 한다.
     */
    @Query("SELECT DISTINCT t FROM Trade t " +
            "LEFT JOIN FETCH t.tradeCategories tc " +
            "LEFT JOIN FETCH tc.category c " +
            "WHERE t.id IN :ids")
    List<Trade> findByIdsWithCategories(@Param("ids") final List<Long> ids);
}
