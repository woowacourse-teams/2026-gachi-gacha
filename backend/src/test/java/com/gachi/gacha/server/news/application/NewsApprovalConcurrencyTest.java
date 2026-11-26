package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.news.application.NewsApprovalService.Vote;
import com.gachi.gacha.server.news.application.NewsApprovalService.VoteStatus;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsSection;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 두 명이 동시에 [승인]을 눌러도 승인과 공개가 한 번만 일어나는지 확인한다. 동시성은 트랜잭션을 롤백하는 테스트로는 볼 수 없어서
 * 실제로 커밋한다. 다른 데이터와 섞이지 않게 전용 주제를 쓰고, 끝나면 그 주제의 데이터를 모두 지운다.
 */
@SpringBootTest
class NewsApprovalConcurrencyTest {

    private static final String TOPIC = "CONCURRENCY_TEST";
    private static final LocalDate FUTURE = LocalDate.of(2099, 1, 1);
    private static final int ROUNDS = 10;

    @Autowired
    private NewsApprovalService service;

    @Autowired
    private NewsBatchJpaRepository batchRepository;

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void cleanUp() {
        jdbcTemplate.update("DELETE FROM news_item WHERE topic = ?", TOPIC);
        jdbcTemplate.update("DELETE FROM news_approval WHERE batch_id IN (SELECT id FROM news_batch WHERE topic = ?)", TOPIC);
        jdbcTemplate.update("DELETE FROM news_candidate WHERE batch_id IN (SELECT id FROM news_batch WHERE topic = ?)", TOPIC);
        jdbcTemplate.update("DELETE FROM news_exclusion WHERE topic = ?", TOPIC);
        jdbcTemplate.update("DELETE FROM news_batch WHERE topic = ?", TOPIC);
    }

    @Test
    @DisplayName("두 명이 동시에 승인해도 한 명만 '승인됨'을 받고, 소식은 한 번만 공개된다")
    void concurrentApprovalsApproveOnce() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            for (int round = 0; round < ROUNDS; round++) {
                NewsBatch batch = batchWithTwoCandidates(round);
                CountDownLatch ready = new CountDownLatch(2);
                CountDownLatch go = new CountDownLatch(1);
                List<Future<Vote>> votes = new ArrayList<>();
                for (String approver : List.of("U1", "U2")) {
                    votes.add(executor.submit(() -> {
                        ready.countDown();
                        go.await();
                        return service.approve(batch.getId(), approver);
                    }));
                }
                ready.await();
                go.countDown();

                List<VoteStatus> statuses = new ArrayList<>();
                for (Future<Vote> vote : votes) {
                    statuses.add(vote.get(30, TimeUnit.SECONDS).status());
                }

                assertThat(statuses).as("라운드 %d", round).containsExactlyInAnyOrder(VoteStatus.VOTED, VoteStatus.APPROVED);
                assertThat(batchRepository.findById(batch.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.APPROVED);
                assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM news_approval WHERE batch_id = ?", Integer.class, batch.getId())).isEqualTo(2);
                assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM news_item WHERE topic = ? AND candidate_id IN "
                        + "(SELECT id FROM news_candidate WHERE batch_id = ?)", Integer.class, TOPIC, batch.getId())).isEqualTo(2);
            }
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("같은 사람이 동시에 두 번 눌러도 1표만 들어간다")
    void concurrentSameApproverCountsOnce() throws Exception {
        NewsBatch batch = batchWithTwoCandidates(0);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch ready = new CountDownLatch(2);
            CountDownLatch go = new CountDownLatch(1);
            List<Future<Vote>> votes = new ArrayList<>();
            for (int index = 0; index < 2; index++) {
                votes.add(executor.submit(() -> {
                    ready.countDown();
                    go.await();
                    return service.approve(batch.getId(), "U1");
                }));
            }
            ready.await();
            go.countDown();
            List<VoteStatus> statuses = new ArrayList<>();
            for (Future<Vote> vote : votes) {
                statuses.add(vote.get(30, TimeUnit.SECONDS).status());
            }

            assertThat(statuses).containsExactlyInAnyOrder(VoteStatus.VOTED, VoteStatus.ALREADY_VOTED);
            assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM news_approval WHERE batch_id = ?", Integer.class, batch.getId())).isEqualTo(1);
            assertThat(batchRepository.findById(batch.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.AWAITING_APPROVAL);
        } finally {
            executor.shutdownNow();
        }
    }

    private NewsBatch batchWithTwoCandidates(final int round) {
        NewsBatch batch = batchRepository.saveAndFlush(NewsBatch.start(TOPIC, "THURSDAY", List.of(
                CollectPeriod.notCollected("chiikawashop_kr", LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 12))), false, "v"));
        batch.complete(Set.of("chiikawashop_kr"), true, GrokUsage.NONE, List.of());
        batchRepository.saveAndFlush(batch);
        for (int index = 0; index < 2; index++) {
            String link = "https://x.com/a/status/" + (900_000 + round * 10 + index);
            NewsSection section = index == 0 ? NewsSection.KOREA_STORE : NewsSection.OTHER_GOODS;
            candidateRepository.save(NewsCandidate.collected(batch.getId(),
                    news(section, NewsKind.RELEASE, "소식 " + round + "-" + index, FUTURE, null, link, true, null)));
        }
        return batch;
    }
}
