package com.gachi.gacha.server.comment.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * 댓글 조회는 조회자가 차단한 회원의 댓글을 제외한다.
 * 비회원 댓글(memberId = null)과 비로그인 조회(viewerId = null)는 차단 기록과의 비교가 참이 될 수 없어 걸러지지 않는다.
 */
@Repository
public interface CommentJpaRepository extends JpaRepository<Comment, Long> {

    @Query("""
            SELECT comment
            FROM Comment comment
            WHERE comment.tradeId = :tradeId
              AND NOT EXISTS (
                  SELECT 1
                  FROM MemberBlock memberBlock
                  WHERE memberBlock.blockerId = :viewerId
                    AND memberBlock.blockedId = comment.memberId
              )
            ORDER BY comment.id ASC
            """)
    List<Comment> findAllVisibleByTradeId(Long tradeId, @Nullable Long viewerId);

    @Query("""
            SELECT COUNT(comment)
            FROM Comment comment
            WHERE comment.tradeId = :tradeId
              AND NOT EXISTS (
                  SELECT 1
                  FROM MemberBlock memberBlock
                  WHERE memberBlock.blockerId = :viewerId
                    AND memberBlock.blockedId = comment.memberId
              )
            """)
    long countVisibleByTradeId(Long tradeId, @Nullable Long viewerId);
}
