package com.gachi.gacha.server.news.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsBatchJpaRepository extends JpaRepository<NewsBatch, Long> {

    /**
     * 수집 중이거나 승인 대기 중인 회차는 주제마다 하나뿐이다(부분 유니크 인덱스).
     */
    Optional<NewsBatch> findByTopicAndStatus(String topic, NewsBatchStatus status);

    /**
     * 계정별 마지막 수집 성공 기간을 찾을 때 최근 회차부터 훑는다. 회차는 주 2회라 몇십 건이면 충분하다.
     */
    List<NewsBatch> findTop30ByTopicOrderByIdDesc(String topic);
}
