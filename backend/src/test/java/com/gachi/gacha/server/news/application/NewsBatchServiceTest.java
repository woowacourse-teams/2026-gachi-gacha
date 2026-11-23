package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.gachi.gacha.server.news.application.NewsBatchService.Started;
import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.infra.NewsProperties;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회차를 만들고 만료·이월하고 저장하는 DB 흐름을 실제 PostgreSQL 에서 확인한다.
 */
@SpringBootTest
@Transactional
class NewsBatchServiceTest {

    private static final String TOPIC = "CHIIKAWA";
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 12);
    private static final LocalDate FROM = LocalDate.of(2026, 11, 5);

    private final NewsProperties.Topic config = NewsFixtures.properties(false, "", 40, 0.6).topic(TOPIC).orElseThrow();

    @Autowired
    private NewsBatchService batchService;

    @Autowired
    private NewsBatchJpaRepository batchRepository;

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("승인 대기 회차가 있으면 만료하고 새 회차를 시작한다. 새 회차는 설정의 프롬프트 버전과 dry-run 을 따른다")
    void expiresAwaitingBatchAndStartsNewOne() {
        // given
        NewsBatch awaiting = awaitingBatch();

        // when
        Started started = batchService.begin(TOPIC, "THURSDAY", config, TODAY).orElseThrow();
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(batchRepository.findById(awaiting.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.EXPIRED);
        NewsBatch created = batchRepository.findById(started.batchId()).orElseThrow();
        assertThat(created.getStatus()).isEqualTo(NewsBatchStatus.COLLECTING);
        assertThat(created.getPromptVersion()).isEqualTo("chiikawa-v2");
        assertThat(created.isDryRun()).isTrue();
        assertThat(started.targets()).extracting(target -> target.handle()).containsExactly("chiikawashop_kr", "chiikawa_kouhou");
    }

    @Test
    @DisplayName("수집 중인 회차가 있으면 새로 시작하지 않지만, 오래 남은 것은 실패로 정리하고 시작한다")
    void skipsFreshCollectingAndFailsStuckOne() {
        // given
        NewsBatch collecting = batchRepository.saveAndFlush(start());

        // when & then: 방금 시작한 회차는 진행 중이다
        assertThat(batchService.begin(TOPIC, "THURSDAY", config, TODAY)).isEmpty();

        // when: 7시간 동안 갱신되지 않았다
        entityManager.createNativeQuery("UPDATE news_batch SET updated_at = NOW() - INTERVAL '7 hours' WHERE id = :id")
                .setParameter("id", collecting.getId()).executeUpdate();
        entityManager.clear();
        Optional<Started> started = batchService.begin(TOPIC, "THURSDAY", config, TODAY);
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(started).isPresent();
        NewsBatch stuck = batchRepository.findById(collecting.getId()).orElseThrow();
        assertThat(stuck.getStatus()).isEqualTo(NewsBatchStatus.FAILED);
        assertThat(stuck.warnings()).containsExactly("수집 중 서버가 멈춘 것으로 보여 실패 처리함");
    }

    @Test
    @DisplayName("결과를 저장하면 후보를 저장하고, 수집한 계정만 수집 성공으로 남기고 승인 대기가 된다")
    void completeStoresCandidatesAndMarksCollectedAccounts() {
        // given
        Started started = batchService.begin(TOPIC, "THURSDAY", config, TODAY).orElseThrow();
        NewsPostProcessor.Result result = new NewsPostProcessor().process(List.of(
                news(NewsSection.KOREA_STORE, NewsKind.RELEASE, "입고", LocalDate.of(2026, 11, 20), null, "https://x.com/a/status/1", true, null),
                news(NewsSection.KOREA_ONLINE, NewsKind.RESTOCK, "재입고", LocalDate.of(2026, 11, 21), null, "https://x.com/a/status/2", true, null)),
                TODAY, null);

        // when
        NewsRunResult.Finished finished = batchService.complete(started.batchId(), result, Set.of("chiikawashop_kr"),
                new GrokUsage(5, 0, 12, 0, 1000, 100, 1_000_000_000L), List.of("경고"), 2, 0);
        entityManager.flush();
        entityManager.clear();

        // then
        NewsBatch saved = batchRepository.findById(started.batchId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(NewsBatchStatus.AWAITING_APPROVAL);
        assertThat(saved.periods()).extracting(CollectPeriod::handle, CollectPeriod::collected)
                .containsExactly(tuple("chiikawashop_kr", true), tuple("chiikawa_kouhou", false));
        assertThat(saved.warnings()).containsExactly("경고");
        assertThat(finished.stats().skippedPosts()).isEqualTo(2);
        assertThat(candidateRepository.findAllByBatchIdOrderByIdAsc(started.batchId()))
                .extracting(NewsCandidate::getTitle).containsExactly("입고", "재입고");
    }

    @Test
    @DisplayName("공개할 소식이 없으면 새 소식 없음으로 끝나고, 실패하면 실패로 남는다")
    void completeWithoutPublishableAndFail() {
        // given
        Started noNews = batchService.begin(TOPIC, "THURSDAY", config, TODAY).orElseThrow();
        entityManager.flush();

        // when
        batchService.complete(noNews.batchId(), new NewsPostProcessor().process(List.of(), TODAY, null),
                Set.of("chiikawashop_kr", "chiikawa_kouhou"), GrokUsage.NONE, List.of(), 0, 0);
        Started failing = batchService.begin(TOPIC, "THURSDAY", config, TODAY).orElseThrow();
        batchService.fail(failing.batchId(), GrokUsage.FAILED_CALL, List.of("모든 계정의 수집에 실패함"));
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(batchRepository.findById(noNews.batchId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.NO_NEWS);
        NewsBatch failed = batchRepository.findById(failing.batchId()).orElseThrow();
        assertThat(failed.getStatus()).isEqualTo(NewsBatchStatus.FAILED);
        assertThat(failed.warnings()).containsExactly("모든 계정의 수집에 실패함");
    }

    private NewsBatch awaitingBatch() {
        NewsBatch batch = batchRepository.saveAndFlush(start());
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, GrokUsage.NONE, List.of());
        batchRepository.flush();
        return batch;
    }

    private NewsBatch start() {
        return NewsBatch.start(TOPIC, "THURSDAY", List.of(
                CollectPeriod.notCollected("chiikawashop_kr", FROM, TODAY),
                CollectPeriod.notCollected("chiikawa_kouhou", FROM, TODAY)), false, "chiikawa-v2");
    }
}
