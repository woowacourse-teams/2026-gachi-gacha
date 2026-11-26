package com.gachi.gacha.server.news.domain;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * 승인·제외·다시 수집 같은 버튼 처리는 회차 행을 잠그고 한다. 두 명이 동시에 [승인]을 눌러도 표를 서로 보지 못해 둘 다
     * 1표로 세는 일이 없고, 승인 전이와 공개가 한 번만 일어난다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select batch from NewsBatch batch where batch.id = :id")
    Optional<NewsBatch> findByIdForUpdate(@Param("id") Long id);

    /**
     * 다음 수집이 승인 대기 회차를 만료하려고 찾을 때 쓴다. 행을 잠그고 조건으로 찾아서, 그 순간 [승인]이 커밋되면 기다렸다가
     * 이미 승인된 회차는 조건에 맞지 않아 찾지 않는다(PostgreSQL 은 잠금을 기다린 뒤 조건을 다시 확인한다).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select batch from NewsBatch batch where batch.topic = :topic and batch.status = :status")
    Optional<NewsBatch> findByTopicAndStatusForUpdate(@Param("topic") String topic, @Param("status") NewsBatchStatus status);

    /**
     * 이미 정해진 발송 예정 시각. 발송 상한(하루·주)을 지키면서 다음 발송 시각을 정할 때 센다.
     */
    @Query("select batch.sendAt from NewsBatch batch where batch.topic = :topic and batch.sendAt is not null "
            + "and batch.sendAt >= :from and batch.id <> :excludeId")
    List<LocalDateTime> findSendAtFrom(@Param("topic") String topic, @Param("from") LocalDateTime from, @Param("excludeId") Long excludeId);

    /**
     * 발송 시각이 지난 승인된 회차. 발송 스케줄러가 1분마다 찾는다.
     */
    @Query("select batch from NewsBatch batch where batch.status = com.gachi.gacha.server.news.domain.NewsBatchStatus.APPROVED "
            + "and batch.sendAt is not null and batch.sendAt <= :now order by batch.sendAt")
    List<NewsBatch> findDueForSending(@Param("now") LocalDateTime now);

    /**
     * 발송 중으로 오래 남은 회차. 서버가 FCM 을 부르는 중에 멈춘 것이다.
     */
    List<NewsBatch> findAllByStatusAndSendStartedAtBefore(NewsBatchStatus status, LocalDateTime before);
}
