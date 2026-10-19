package com.gachi.gacha.server.member.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberBlockJpaRepository extends JpaRepository<MemberBlock, Long> {

    Optional<MemberBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    List<MemberBlock> findAllByBlockerIdOrderByCreatedAtDesc(Long blockerId);

    @Query("""
            SELECT CASE WHEN COUNT(memberBlock) > 0 THEN true ELSE false END
            FROM MemberBlock memberBlock
            WHERE (memberBlock.blockerId = :firstMemberId AND memberBlock.blockedId = :secondMemberId)
               OR (memberBlock.blockerId = :secondMemberId AND memberBlock.blockedId = :firstMemberId)
            """)
    boolean existsBetween(Long firstMemberId, Long secondMemberId);
}
