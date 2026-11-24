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
import com.gachi.gacha.server.news.domain.NewsExclusion;
import com.gachi.gacha.server.news.domain.NewsExclusionJpaRepository;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsTiming;
import com.gachi.gacha.server.news.infra.NewsProperties;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    // 서비스는 실제 시계의 오늘을 쓰므로, 끝나지 않은 소식은 먼 미래, 끝난 소식은 먼 과거 날짜로 둔다
    private static final LocalDate FUTURE = LocalDate.of(2099, 1, 1);
    private static final LocalDate PAST = LocalDate.of(2020, 1, 1);

    private final NewsProperties.Topic config = NewsFixtures.properties(false, "", 40, 0.6).topic(TOPIC).orElseThrow();

    @Autowired
    private NewsBatchService batchService;

    @Autowired
    private NewsBatchJpaRepository batchRepository;

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Autowired
    private NewsItemJpaRepository itemRepository;

    @Autowired
    private NewsExclusionJpaRepository exclusionRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("승인 대기 회차가 있으면 만료하고 새 회차를 시작한다. 새 회차는 설정의 프롬프트 버전과 dry-run 을 따른다")
    void expiresAwaitingBatchAndStartsNewOne() {
        // given
        NewsBatch awaiting = awaitingBatch();

        // when
        Started started = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
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
        assertThat(batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY)).isEmpty();

        // when: 7시간 동안 갱신되지 않았다
        entityManager.createNativeQuery("UPDATE news_batch SET updated_at = NOW() - INTERVAL '7 hours' WHERE id = :id")
                .setParameter("id", collecting.getId()).executeUpdate();
        entityManager.clear();
        Optional<Started> started = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY);
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
        Started started = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
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
        assertThat(saved.warnings()).containsExactly("경고", "제외: 중복 0 · 형식 오류 0 · 굿즈 아님 2");
        assertThat(finished.candidates()).hasSize(2);
        assertThat(candidateRepository.findAllByBatchIdOrderByIdAsc(started.batchId()))
                .extracting(NewsCandidate::getTitle).containsExactly("입고", "재입고");
    }

    @Test
    @DisplayName("공개할 소식이 없으면 새 소식 없음으로 끝나고, 실패하면 실패로 남는다")
    void completeWithoutPublishableAndFail() {
        // given
        Started noNews = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
        entityManager.flush();

        // when
        batchService.complete(noNews.batchId(), new NewsPostProcessor().process(List.of(), TODAY, null),
                Set.of("chiikawashop_kr", "chiikawa_kouhou"), GrokUsage.NONE, List.of(), 0, 0);
        Started failing = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
        batchService.fail(failing.batchId(), GrokUsage.FAILED_CALL, List.of("모든 계정의 수집에 실패함"));
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(batchRepository.findById(noNews.batchId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.NO_NEWS);
        NewsBatch failed = batchRepository.findById(failing.batchId()).orElseThrow();
        assertThat(failed.getStatus()).isEqualTo(NewsBatchStatus.FAILED);
        assertThat(failed.warnings()).containsExactly("모든 계정의 수집에 실패함");
    }

    @Test
    @DisplayName("만료된 회차의 후보 중 링크가 검증됐고 끝나지 않았고 공개·제외되지 않은 것만 새 회차로 이월한다")
    void carriesOnlyEligibleCandidatesFromExpiredBatch() {
        // given: 이월할 수 있는 2건(푸시 대상 1, 탭만 1)과 이월하면 안 되는 후보들
        NewsBatch awaiting = awaitingBatch();
        NewsCandidate push = candidate(awaiting, NewsSection.KOREA_STORE, "푸시", "x:1", FUTURE, null, true);
        NewsCandidate tabOnly = candidate(awaiting, NewsSection.OTHER_GOODS, "탭만", "x:2", FUTURE, null, true);
        NewsCandidate published = candidate(awaiting, NewsSection.KOREA_STORE, "이미 공개", "x:3", FUTURE, null, true);
        NewsCandidate excluded = candidate(awaiting, NewsSection.KOREA_STORE, "제외함", "x:4", FUTURE, null, true);
        candidate(awaiting, NewsSection.KOREA_STORE, "링크 미확인", "x:5", FUTURE, null, false);
        candidate(awaiting, NewsSection.KOREA_STORE, "그 사이 끝남", "x:6", PAST, PAST, true);
        candidate(awaiting, NewsSection.KOREA_STORE, "수집 때 이미 끝남", "x:7", PAST, PAST, true, NewsTiming.ENDED);
        itemRepository.save(NewsItem.publish(TOPIC, published, LocalDateTime.now()));
        exclusionRepository.save(new NewsExclusion(TOPIC, excluded.linkKey(), "U_REVIEWER"));
        entityManager.flush();

        // when
        Started started = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
        entityManager.flush();
        entityManager.clear();

        // then
        List<NewsCandidate> carried = candidateRepository.findAllByBatchIdOrderByIdAsc(started.batchId());
        assertThat(carried).extracting(NewsCandidate::getTitle, NewsCandidate::getCarriedFromId)
                .containsExactly(tuple("푸시", push.getId()), tuple("탭만", tabOnly.getId()));
        assertThat(started.expired()).isEqualTo(new NewsRunResult.Expired(awaiting.getId(), 2));
    }

    @Test
    @DisplayName("이월된 후보를 다시 이월해도 처음 수집한 후보를 가리키고, 승인됐거나 이월할 후보가 없는 회차에서는 이월하지 않는다")
    void carriesOnlyFromExpiredOrFailedAndKeepsOrigin() {
        // given: 첫 회차의 후보가 두 번 연속 승인되지 못하고 만료된다
        NewsBatch first = awaitingBatch();
        NewsCandidate origin = candidate(first, NewsSection.KOREA_STORE, "푸시", "x:1", FUTURE, null, true);
        entityManager.flush();
        Started second = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
        batchService.complete(second.batchId(), new NewsPostProcessor().process(List.of(), TODAY, null),
                Set.of("chiikawashop_kr", "chiikawa_kouhou"), GrokUsage.NONE, List.of(), 0, 0);

        // when
        Started third = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(candidateRepository.findAllByBatchIdOrderByIdAsc(third.batchId()))
                .extracting(NewsCandidate::getCarriedFromId).containsExactly(origin.getId());
        assertThat(third.expired().carriedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("승인된 회차 다음에는 이월하지 않는다. 승인된 소식은 이미 공개됐다")
    void doesNotCarryFromApprovedBatch() {
        // given
        NewsBatch approved = awaitingBatch();
        candidate(approved, NewsSection.KOREA_STORE, "푸시", "x:1", FUTURE, null, true);
        approved.approve(LocalDateTime.now(), null);
        entityManager.flush();

        // when
        Started started = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();

        // then
        assertThat(candidateRepository.findAllByBatchIdOrderByIdAsc(started.batchId())).isEmpty();
        assertThat(started.expired()).isNull();
    }

    @Test
    @DisplayName("[다시 수집]으로 버린 회차 다음에는 이월로 받았던 후보만 넘기고, 직접 수집한 후보는 다시 수집하므로 넘기지 않는다")
    void carriesOnlyCarriedCandidatesFromDiscardedBatch() {
        // given: 이전 회차에서 이월로 받은 후보 1건과 직접 수집한 후보 1건이 든 회차를 버린다
        NewsBatch older = expiredBatch();
        NewsCandidate origin = candidate(older, NewsSection.KOREA_STORE, "이월로 받음", "x:2", FUTURE, null, true);
        NewsBatch discarded = awaitingBatch();
        candidate(discarded, NewsSection.KOREA_STORE, "직접 수집", "x:1", FUTURE, null, true);
        candidateRepository.save(origin.carryTo(discarded.getId()));
        discarded.discard();
        entityManager.flush();

        // when
        Started started = batchService.begin(TOPIC, "RECOLLECT", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(candidateRepository.findAllByBatchIdOrderByIdAsc(started.batchId()))
                .extracting(NewsCandidate::getTitle, NewsCandidate::getCarriedFromId)
                .containsExactly(tuple("이월로 받음", origin.getId()));
        assertThat(started.expired()).isNull();
    }

    @Test
    @DisplayName("새로 수집한 소식이 이미 공개됐거나 제외됐거나 이월된 링크이면 올리지 않고, 중복으로 센다")
    void dropsNewNewsWithKnownLinks() {
        // given: 이월된 후보 1건 + 이미 공개한 링크 + 제외한 링크
        NewsBatch awaiting = awaitingBatch();
        candidate(awaiting, NewsSection.KOREA_STORE, "이월될 소식", "x:1", FUTURE, null, true);
        NewsCandidate published = candidate(awaiting, NewsSection.KOREA_STORE, "공개됨", "x:2", FUTURE, null, true);
        itemRepository.save(NewsItem.publish(TOPIC, published, LocalDateTime.now()));
        exclusionRepository.save(new NewsExclusion(TOPIC, "x:3", "U_REVIEWER"));
        entityManager.flush();
        Started started = batchService.begin(TOPIC, "THURSDAY", config.targetsOf("THURSDAY"), config, TODAY).orElseThrow();
        NewsPostProcessor.Result result = new NewsPostProcessor().process(List.of(
                news(NewsSection.KOREA_STORE, NewsKind.RELEASE, "이월과 같은 링크", FUTURE, null, "https://x.com/a/status/1", true, null),
                news(NewsSection.KOREA_STORE, NewsKind.RELEASE, "이미 공개한 링크", FUTURE, null, "https://x.com/a/status/2", true, null),
                news(NewsSection.KOREA_STORE, NewsKind.RELEASE, "제외한 링크", FUTURE, null, "https://x.com/a/status/3", true, null),
                news(NewsSection.KOREA_STORE, NewsKind.RELEASE, "진짜 새 소식", FUTURE, null, "https://x.com/a/status/9", true, null),
                news(NewsSection.KOREA_STORE, NewsKind.NOTICE, "링크 없는 소식", null, null, null, null, null)),
                TODAY, null);

        // when
        NewsRunResult.Finished finished = batchService.complete(started.batchId(), result, Set.of("chiikawashop_kr"),
                GrokUsage.NONE, List.of(), 0, 0);
        entityManager.flush();
        entityManager.clear();

        // then: 이월된 1건 + 새 소식 1건 + 링크 없는 확인 필요 1건
        assertThat(candidateRepository.findAllByBatchIdOrderByIdAsc(started.batchId())).extracting(NewsCandidate::getTitle)
                .containsExactly("이월될 소식", "진짜 새 소식", "링크 없는 소식");
        assertThat(finished.batch().warnings()).containsExactly("제외: 중복 3 · 형식 오류 0 · 굿즈 아님 0");
    }

    private NewsCandidate candidate(
            final NewsBatch batch,
            final NewsSection section,
            final String title,
            final String linkKey,
            final LocalDate start,
            final LocalDate end,
            final boolean verified
    ) {
        return candidate(batch, section, title, linkKey, start, end, verified, null);
    }

    private NewsCandidate candidate(
            final NewsBatch batch,
            final NewsSection section,
            final String title,
            final String linkKey,
            final LocalDate start,
            final LocalDate end,
            final boolean verified,
            final NewsTiming timing
    ) {
        String link = "https://x.com/a/status/" + linkKey.substring(2);
        return candidateRepository.save(NewsCandidate.collected(batch.getId(),
                news(section, NewsKind.RELEASE, title, start, end, link, verified, timing)));
    }

    private NewsBatch expiredBatch() {
        NewsBatch batch = awaitingBatch();
        batch.expire();
        batchRepository.flush();
        return batch;
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
