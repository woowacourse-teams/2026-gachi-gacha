package com.gachi.gacha.server.comment.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentJpaRepository extends JpaRepository<Comment, Long> {

    List<Comment> findAllByTradeIdOrderByIdAsc(final Long tradeId);

    long countByTradeId(final Long tradeId);
}
