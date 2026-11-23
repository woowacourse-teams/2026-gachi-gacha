package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

/**
 * V30 마이그레이션과 엔티티 매핑, 부분 유니크 인덱스를 실제 PostgreSQL 에서 확인한다.
 */
@SpringBootTest
@Transactional
class NewsBatchJpaRepositoryTest {

    private static final LocalDate FROM = LocalDate.of(2026, 11, 9);
    private static final LocalDate TO = LocalDate.of(2026, 11, 12);
    private static final String LINK = "https://x.com/chiikawashop_kr/status/2118131184446124112";

    @Autowired
    private NewsBatchJpaRepository batchRepository;

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("회차의 기간·사용량·경고와 후보의 내용을 JSONB 로 저장하고 그대로 읽는다")
    void savesAndReadsBatchAndCandidate() {
        // given
        NewsBatch batch = batchRepository.save(NewsBatch.start("CHIIKAWA", "THURSDAY",
                List.of(CollectPeriod.notCollected("chiikawashop_kr", FROM, TO)), true, "chiikawa-v2"));
        GrokUsage usage = new GrokUsage(2, 1, 5, 0, 20000, 2000, 40_000_000);
        batch.complete(Set.of("chiikawashop_kr"), true, usage, List.of("[KR_shop_2026-11-09] 게시물 10건"));
        candidateRepository.save(NewsCandidate.collected(batch.getId(), NewsFixtures.news(NewsSection.KOREA_STORE,
                NewsKind.ENTRY_RESERVATION, "용산점 예약 입장 안내", FROM, TO, LINK, true, NewsTiming.ONGOING)));
        entityManager.flush();
        entityManager.clear();

        // when
        NewsBatch found = batchRepository.findById(batch.getId()).orElseThrow();
        List<NewsCandidate> candidates = candidateRepository.findAllByBatchIdOrderByIdAsc(batch.getId());

        // then
        assertThat(found.getStatus()).isEqualTo(NewsBatchStatus.AWAITING_APPROVAL);
        assertThat(found.isDryRun()).isTrue();
        assertThat(found.periods()).containsExactly(new CollectPeriod("chiikawashop_kr", FROM, TO, true));
        assertThat(found.usage()).isEqualTo(usage);
        assertThat(found.warnings()).containsExactly("[KR_shop_2026-11-09] 게시물 10건");
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(candidates).singleElement().satisfies(candidate -> {
            assertThat(candidate.getKind()).isEqualTo(NewsKind.ENTRY_RESERVATION);
            assertThat(candidate.getReview()).isEqualTo(NewsReview.PUSH_TARGET);
            assertThat(candidate.getPostedAt()).isNotNull();
            assertThat(candidate.detail()).isEqualTo(NewsFixtures.detail());
        });
    }

    @Test
    @DisplayName("주제마다 수집 중이거나 승인 대기인 회차는 하나뿐이다")
    void allowsOneActiveBatchPerTopic() {
        // given
        NewsBatch awaiting = batchRepository.save(start("CHIIKAWA"));
        awaiting.complete(Set.of(), true, GrokUsage.NONE, List.of());
        entityManager.flush();

        // when & then
        assertThatThrownBy(() -> {
            batchRepository.save(start("CHIIKAWA"));
            entityManager.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("승인 대기 회차를 만료하고 먼저 반영하면 같은 주제의 새 회차를 시작할 수 있고, 다른 주제는 서로 막지 않는다")
    void startsNewBatchAfterExpire() {
        // given
        NewsBatch awaiting = batchRepository.save(start("CHIIKAWA"));
        awaiting.complete(Set.of(), true, GrokUsage.NONE, List.of());
        batchRepository.save(start("OTHER_TOPIC"));
        entityManager.flush();

        // when
        awaiting.expire();
        entityManager.flush();
        NewsBatch next = batchRepository.save(start("CHIIKAWA"));
        entityManager.flush();

        // then
        assertThat(batchRepository.findByTopicAndStatus("CHIIKAWA", NewsBatchStatus.COLLECTING))
                .map(NewsBatch::getId).contains(next.getId());
        assertThat(batchRepository.findTop30ByTopicOrderByIdDesc("CHIIKAWA"))
                .extracting(NewsBatch::getId).containsExactly(next.getId(), awaiting.getId());
    }

    private NewsBatch start(final String topic) {
        return NewsBatch.start(topic, "THURSDAY", List.of(CollectPeriod.notCollected("chiikawashop_kr", FROM, TO)),
                false, "chiikawa-v2");
    }
}
