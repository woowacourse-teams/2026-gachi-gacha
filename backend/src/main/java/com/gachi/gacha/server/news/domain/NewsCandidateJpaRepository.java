package com.gachi.gacha.server.news.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsCandidateJpaRepository extends JpaRepository<NewsCandidate, Long> {

    List<NewsCandidate> findAllByBatchIdOrderByIdAsc(Long batchId);
}
