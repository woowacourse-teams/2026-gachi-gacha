package com.gachi.gacha.server.trade.domain;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeInferenceJpaRepository extends JpaRepository<TradeInference, Long> {

    /**
     * 추론이 필요한 글의 ID. 최신 글부터(id 내림차순) 조회하고 cursor 보다 작은 id 만 가져온다.
     * - 추론 행이 없는 글 (새 글, 기존 글 백필, 이전 실행에서 실패한 글)
     * - 추론 이후에 수정된 글 (updatedAt > inferredAt)
     * settledBefore 이후에 변경된 글은 제외한다. 등록 직후와 연속 수정 중에는 잠시 기다렸다가 안정된 뒤에 추론한다.
     */
    @Query("""
            select t.id from Trade t
            left join TradeInference i on i.tradeId = t.id
            where t.id < :cursor
              and t.updatedAt <= :settledBefore
              and (i.tradeId is null or t.updatedAt > i.inferredAt)
            order by t.id desc
            """)
    List<Long> findTradeIdsNeedingInference(
            @Param("cursor") final Long cursor,
            @Param("settledBefore") final LocalDateTime settledBefore,
            Pageable pageable
    );
}
