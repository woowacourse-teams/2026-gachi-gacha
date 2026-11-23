package com.gachi.gacha.server.news.domain;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsMemberTopicJpaRepository extends JpaRepository<NewsMemberTopic, Long> {

    Optional<NewsMemberTopic> findByMemberIdAndTopic(Long memberId, String topic);

    /**
     * 행이 없을 때만 만든다. 같은 회원의 첫 요청이 동시에 들어와도 한쪽이 실패하지 않도록 DB 가 중복을 걸러낸다.
     */
    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT INTO news_member_topic (member_id, topic, subscribed, created_at, updated_at)
            VALUES (:memberId, :topic, false, :now, :now)
            ON CONFLICT (member_id, topic) DO NOTHING
            """, nativeQuery = true)
    void insertIfAbsent(@Param("memberId") Long memberId, @Param("topic") String topic, @Param("now") LocalDateTime now);
}
