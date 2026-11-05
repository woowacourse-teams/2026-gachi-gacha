package com.gachi.gacha.server.favorite.signal.domain;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FavoriteSignalJpaRepository extends JpaRepository<FavoriteSignal, Long> {

    @Modifying
    @Query("""
            delete from FavoriteSignal s
            where s.memberId = :memberId and s.favoriteType = :type and s.targetId = :targetId
            """)
    void deleteByMemberAndTarget(
            @Param("memberId") Long memberId,
            @Param("type") FavoriteType type,
            @Param("targetId") Long targetId
    );

    @Modifying
    @Query("""
            delete from FavoriteSignal s
            where s.favoriteType = :type and s.targetId = :targetId and s.memberId in :memberIds
            """)
    void deleteByTarget(
            @Param("type") FavoriteType type,
            @Param("targetId") Long targetId,
            @Param("memberIds") Collection<Long> memberIds
    );

    /** 같은 신호를 가진 관심 등록의 가중치를 시간 감쇠와 함께 회원별로 합산한다. */
    @Query(value = """
            select s.member_id as "memberId",
                   s.signal_value as "signalValue",
                   sum(s.weight * power(0.5, greatest(0.0,
                       extract(epoch from (cast(:now as timestamp) - s.created_at))
                       / (86400.0 * :halfLifeDays)))) as "score"
            from favorite_signal s
            where s.signal_type = :signalType and s.signal_value in (:signalValues)
            group by s.member_id, s.signal_value
            """, nativeQuery = true)
    List<MemberSignalScore> findMemberScores(
            @Param("signalType") String signalType,
            @Param("signalValues") Collection<String> signalValues,
            @Param("now") LocalDateTime now,
            @Param("halfLifeDays") double halfLifeDays
    );

    interface MemberSignalScore {

        Long getMemberId();

        String getSignalValue();

        Double getScore();
    }
}
