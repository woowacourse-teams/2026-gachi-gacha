package com.gachi.gacha.server.news.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsApprovalJpaRepository extends JpaRepository<NewsApproval, Long> {

    boolean existsByBatchIdAndSlackUserId(Long batchId, String slackUserId);

    List<NewsApproval> findAllByBatchIdOrderByIdAsc(Long batchId);
}
