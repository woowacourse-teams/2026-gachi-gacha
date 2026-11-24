package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.gachi.gacha.server.news.application.NewsApprovalService.Discarded;
import com.gachi.gacha.server.news.application.NewsApprovalService.Result;
import com.gachi.gacha.server.news.application.NewsApprovalService.Vote;
import com.gachi.gacha.server.news.application.NewsApprovalService.VoteStatus;
import com.gachi.gacha.server.news.application.dto.BatchView;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsApprovalJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.domain.NewsExclusionJpaRepository;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsSendPolicy;
import com.gachi.gacha.server.news.domain.NewsTiming;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * 제외·되돌리기·승인·다시 수집의 상태 변화를 실제 PostgreSQL 에서 확인한다. 승인에 필요한 인원은 기본값 2명이다.
 */
@SpringBootTest
@Transactional
class NewsApprovalServiceTest {

    private static final String TOPIC = "CHIIKAWA";
    private static final LocalDate FUTURE = LocalDate.of(2099, 1, 1);
    private static final LocalDate PAST = LocalDate.of(2020, 1, 1);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Autowired
    private NewsApprovalService service;

    @Autowired
    private NewsBatchJpaRepository batchRepository;

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Autowired
    private NewsApprovalJpaRepository approvalRepository;

    @Autowired
    private NewsExclusionJpaRepository exclusionRepository;

    @Autowired
    private NewsItemJpaRepository itemRepository;

    @Autowired
    private NewsSendPolicy sendPolicy;

    @Autowired
    private EntityManager entityManager;

    @Nested
    @DisplayName("승인")
    class Approve {

        @Test
        @DisplayName("서로 다른 2명이 누르면 승인되고, 소식을 발송 예정 시각에 공개한다 (푸시와 목록 공개 시각이 같다)")
        void approvesWithTwoDifferentApprovers() {
            NewsBatch batch = awaitingBatch();
            NewsCandidate push = push(batch, "푸시 소식", "x:1");
            NewsCandidate tabOnly = tabOnly(batch, "탭만 소식", "x:2");

            Vote first = service.approve(batch.getId(), "U1");
            Vote second = service.approve(batch.getId(), "U2");
            entityManager.flush();
            entityManager.clear();

            assertThat(first).isEqualTo(new Vote(VoteStatus.VOTED, 1));
            assertThat(second).isEqualTo(new Vote(VoteStatus.APPROVED, 2));
            NewsBatch approved = batchRepository.findById(batch.getId()).orElseThrow();
            assertThat(approved.getStatus()).isEqualTo(NewsBatchStatus.APPROVED);
            assertThat(approved.getApprovedAt()).isNotNull();
            assertThat(approved.getSendAt()).isNotNull().isAfterOrEqualTo(approved.getApprovedAt().minusSeconds(1));
            assertThat(sendPolicy.isWithinWindow(approved.getSendAt().atZone(ZoneId.systemDefault()).toInstant())).isTrue();
            assertThat(itemRepository.findAll()).filteredOn(item -> item.getTopic().equals(TOPIC))
                    .extracting(item -> item.getCandidate().getId(), NewsItem::getPublishedAt)
                    .containsExactlyInAnyOrder(tuple(push.getId(), approved.getSendAt()), tuple(tabOnly.getId(), approved.getSendAt()));
        }

        @Test
        @DisplayName("같은 사람이 두 번 눌러도 1표이고 승인되지 않는다")
        void sameApproverTwiceIsOneVote() {
            NewsBatch batch = awaitingBatch();
            push(batch, "푸시 소식", "x:1");

            Vote first = service.approve(batch.getId(), "U1");
            Vote again = service.approve(batch.getId(), "U1");

            assertThat(first.status()).isEqualTo(VoteStatus.VOTED);
            assertThat(again).isEqualTo(new Vote(VoteStatus.ALREADY_VOTED, 1));
            assertThat(approvalRepository.findAllByBatchIdOrderByIdAsc(batch.getId())).hasSize(1);
            assertThat(batchRepository.findById(batch.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.AWAITING_APPROVAL);
            assertThat(itemRepository.findAll()).filteredOn(item -> item.getTopic().equals(TOPIC)).isEmpty();
        }

        @Test
        @DisplayName("표가 들어온 뒤 소식을 제외해도 이미 들어온 표는 그대로 세고, 2표가 되는 순간의 후보 상태로 공개한다")
        void exclusionAfterVoteKeepsVoteAndMarksChange() {
            NewsBatch batch = awaitingBatch();
            NewsCandidate kept = push(batch, "남길 소식", "x:1");
            NewsCandidate excluded = push(batch, "뺄 소식", "x:2");

            service.approve(batch.getId(), "U1");
            Result result = service.exclude(batch.getId(), excluded.getId(), "U3");
            Vote second = service.approve(batch.getId(), "U2");
            entityManager.flush();
            entityManager.clear();

            assertThat(result).isEqualTo(Result.DONE);
            assertThat(second).isEqualTo(new Vote(VoteStatus.APPROVED, 2));
            NewsBatch approved = batchRepository.findById(batch.getId()).orElseThrow();
            assertThat(approved.getChangedAfterVoteBy()).isEqualTo("U3");
            assertThat(approvalRepository.findAllByBatchIdOrderByIdAsc(batch.getId())).extracting(approval -> approval.getSlackUserId())
                    .containsExactly("U1", "U2");
            assertThat(itemRepository.findAll()).filteredOn(item -> item.getTopic().equals(TOPIC))
                    .extracting(item -> item.getCandidate().getId()).containsExactly(kept.getId());
        }

        @Test
        @DisplayName("표가 없을 때의 제외는 '승인 후 변경'으로 표시하지 않는다")
        void exclusionBeforeAnyVoteIsNotMarked() {
            NewsBatch batch = awaitingBatch();
            NewsCandidate push = push(batch, "푸시", "x:1");

            service.exclude(batch.getId(), push.getId(), "U3");

            assertThat(batchRepository.findById(batch.getId()).orElseThrow().getChangedAfterVoteBy()).isNull();
        }

        @Test
        @DisplayName("푸시 대상이 모두 제외되면 발송 예정 없이 탭에만 공개하고, 그 시각은 승인한 시각이다")
        void tabOnlyApprovalHasNoSendAt() {
            NewsBatch batch = awaitingBatch();
            NewsCandidate push = push(batch, "푸시", "x:1");
            NewsCandidate tabOnly = tabOnly(batch, "탭만 소식", "x:2");
            service.exclude(batch.getId(), push.getId(), "U3");

            service.approve(batch.getId(), "U1");
            service.approve(batch.getId(), "U2");
            entityManager.flush();
            entityManager.clear();

            NewsBatch approved = batchRepository.findById(batch.getId()).orElseThrow();
            assertThat(approved.getSendAt()).isNull();
            assertThat(itemRepository.findAll()).filteredOn(item -> item.getTopic().equals(TOPIC))
                    .extracting(item -> item.getCandidate().getId(), NewsItem::getPublishedAt)
                    .containsExactly(tuple(tabOnly.getId(), approved.getApprovedAt()));
        }

        @Test
        @DisplayName("수집한 뒤 승인까지 사이에 끝난 소식, 이미 공개된 링크, 확인 필요 소식은 공개하지 않는다")
        void doesNotPublishEndedPublishedOrUnverified() {
            NewsBatch older = batchRepository.saveAndFlush(NewsBatch.start(TOPIC, "THURSDAY", periods(), false, "v"));
            older.complete(Set.of("chiikawashop_kr"), true, GrokUsage.NONE, List.of());
            older.expire();
            batchRepository.flush();
            NewsCandidate publishedBefore = candidate(older, NewsSection.KOREA_STORE, "이미 공개", "x:4", FUTURE, null, true, null);
            itemRepository.save(NewsItem.publish(TOPIC, publishedBefore, LocalDateTime.now()));
            NewsBatch batch = awaitingBatch();
            NewsCandidate fine = push(batch, "정상", "x:1");
            candidate(batch, NewsSection.KOREA_STORE, "그 사이 끝남", "x:2", PAST, PAST, true, NewsTiming.UPCOMING);
            candidate(batch, NewsSection.KOREA_STORE, "링크 미확인", "x:3", FUTURE, null, false, null);
            candidate(batch, NewsSection.KOREA_STORE, "이미 공개된 링크", "x:4", FUTURE, null, true, null);

            service.approve(batch.getId(), "U1");
            service.approve(batch.getId(), "U2");
            entityManager.flush();
            entityManager.clear();

            assertThat(itemRepository.findAll()).filteredOn(item -> item.getTopic().equals(TOPIC))
                    .extracting(item -> item.getCandidate().getId())
                    .containsExactlyInAnyOrder(fine.getId(), publishedBefore.getId());
        }

        @Test
        @DisplayName("이미 발송 예정인 회차가 있으면 하루 상한(1건) 때문에 다음 발송 가능 시각으로 미룬다")
        void postponesByDailyLimit() {
            NewsBatch first = awaitingBatch();
            push(first, "첫 푸시", "x:1");
            service.approve(first.getId(), "U1");
            service.approve(first.getId(), "U2");
            entityManager.flush();
            NewsBatch second = awaitingBatch();
            push(second, "둘째 푸시", "x:2");

            service.approve(second.getId(), "U1");
            service.approve(second.getId(), "U2");
            entityManager.flush();
            entityManager.clear();

            LocalDateTime firstAt = batchRepository.findById(first.getId()).orElseThrow().getSendAt();
            LocalDateTime secondAt = batchRepository.findById(second.getId()).orElseThrow().getSendAt();
            assertThat(day(secondAt)).isAfter(day(firstAt));
            assertThat(sendPolicy.isWithinWindow(secondAt.atZone(ZoneId.systemDefault()).toInstant())).isTrue();
        }

        @Test
        @DisplayName("승인되었거나 dry-run 이거나 없는 회차에는 표를 더하지 않는다")
        void closedBatchesDoNotTakeVotes() {
            NewsBatch approved = awaitingBatch();
            push(approved, "푸시", "x:1");
            service.approve(approved.getId(), "U1");
            service.approve(approved.getId(), "U2");
            entityManager.flush();
            NewsBatch dryRun = batchRepository.saveAndFlush(NewsBatch.start(TOPIC, "THURSDAY", periods(), true, "v"));
            dryRun.complete(Set.of("chiikawashop_kr"), true, GrokUsage.NONE, List.of());
            entityManager.flush();

            assertThat(service.approve(approved.getId(), "U3").status()).isEqualTo(VoteStatus.NOT_AWAITING);
            assertThat(service.approve(dryRun.getId(), "U1").status()).isEqualTo(VoteStatus.NOT_AWAITING);
            assertThat(service.approve(-1L, "U1").status()).isEqualTo(VoteStatus.NOT_FOUND);
            assertThat(approvalRepository.findAllByBatchIdOrderByIdAsc(approved.getId())).hasSize(2);
            assertThat(approvalRepository.findAllByBatchIdOrderByIdAsc(dryRun.getId())).isEmpty();
        }
    }

    @Nested
    @DisplayName("제외와 되돌리기")
    class Exclusion {

        @Test
        @DisplayName("제외하면 그 링크를 기록하고, 같은 소식을 다시 제외해도 바뀌는 것이 없다")
        void excludesOnceAndIsIdempotent() {
            NewsBatch batch = awaitingBatch();
            NewsCandidate push = push(batch, "푸시", "x:1");

            Result first = service.exclude(batch.getId(), push.getId(), "U3");
            Result again = service.exclude(batch.getId(), push.getId(), "U4");

            assertThat(first).isEqualTo(Result.DONE);
            assertThat(again).isEqualTo(Result.NO_CHANGE);
            assertThat(exclusionRepository.existsByTopicAndLinkKey(TOPIC, "x:1")).isTrue();
            assertThat(exclusionRepository.findAll()).filteredOn(exclusion -> exclusion.getTopic().equals(TOPIC))
                    .extracting(exclusion -> exclusion.getSlackUserId()).containsExactly("U3");
        }

        @Test
        @DisplayName("되돌리면 제외 기록을 지워서 다시 공개 대상이 되고, 제외하지 않은 소식을 되돌려도 바뀌는 것이 없다")
        void undoRemovesExclusion() {
            NewsBatch batch = awaitingBatch();
            NewsCandidate push = push(batch, "푸시", "x:1");
            service.exclude(batch.getId(), push.getId(), "U3");

            Result undone = service.undoExclusion(batch.getId(), push.getId(), "U3");
            Result again = service.undoExclusion(batch.getId(), push.getId(), "U3");

            assertThat(undone).isEqualTo(Result.DONE);
            assertThat(again).isEqualTo(Result.NO_CHANGE);
            assertThat(exclusionRepository.existsByTopicAndLinkKey(TOPIC, "x:1")).isFalse();
        }

        @Test
        @DisplayName("승인된 회차, 다른 회차의 소식, 공개할 수 없는 소식(확인 필요·지난 소식)은 제외할 수 없다")
        void rejectsInvalidTargets() {
            NewsBatch approved = awaitingBatch();
            NewsCandidate approvedPush = push(approved, "푸시", "x:1");
            service.approve(approved.getId(), "U1");
            service.approve(approved.getId(), "U2");
            entityManager.flush();
            NewsBatch open = awaitingBatch();
            NewsCandidate openPush = push(open, "다른 회차 푸시", "x:2");
            NewsCandidate unverified = candidate(open, NewsSection.KOREA_STORE, "링크 미확인", "x:3", FUTURE, null, false, null);

            assertThat(service.exclude(approved.getId(), approvedPush.getId(), "U3")).isEqualTo(Result.NOT_AWAITING);
            assertThat(service.exclude(open.getId(), approvedPush.getId(), "U3")).isEqualTo(Result.NOT_FOUND);
            assertThat(service.exclude(open.getId(), unverified.getId(), "U3")).isEqualTo(Result.NOT_FOUND);
            assertThat(service.exclude(-1L, openPush.getId(), "U3")).isEqualTo(Result.NOT_FOUND);
            assertThat(exclusionRepository.findAll()).filteredOn(exclusion -> exclusion.getTopic().equals(TOPIC)).isEmpty();
        }
    }

    @Nested
    @DisplayName("다시 수집")
    class Discard {

        @Test
        @DisplayName("승인 대기 회차를 버리고 다시 수집할 주제와 계정을 돌려주며, 제외 기록은 남기지 않는다")
        void discardsAwaitingBatch() {
            NewsBatch batch = awaitingBatch();
            push(batch, "푸시", "x:1");

            Optional<Discarded> discarded = service.discard(batch.getId());
            Optional<Discarded> again = service.discard(batch.getId());

            assertThat(discarded).contains(new Discarded(TOPIC, List.of("chiikawashop_kr", "chiikawa_kouhou")));
            assertThat(again).isEmpty();
            assertThat(batchRepository.findById(batch.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.DISCARDED);
            assertThat(exclusionRepository.findAll()).filteredOn(exclusion -> exclusion.getTopic().equals(TOPIC)).isEmpty();
        }

        @Test
        @DisplayName("승인된 회차는 버릴 수 없다")
        void cannotDiscardApprovedBatch() {
            NewsBatch batch = awaitingBatch();
            push(batch, "푸시", "x:1");
            service.approve(batch.getId(), "U1");
            service.approve(batch.getId(), "U2");

            assertThat(service.discard(batch.getId())).isEmpty();
        }
    }

    @Nested
    @DisplayName("발송 상태 변화")
    class Sending {

        @Test
        @DisplayName("발송 시각이 지난 승인된 회차만 찾고, 발송 중으로 표시는 한 번만 성공한다")
        void findsDueAndClaimsOnce() {
            NewsBatch batch = approvedBatchWithPush();
            LocalDateTime sendAt = batch.getSendAt();

            assertThat(service.findDueForSending(sendAt.minusSeconds(1))).doesNotContain(batch.getId());
            assertThat(service.findDueForSending(sendAt)).contains(batch.getId());
            boolean first = service.claimForSending(batch.getId(), sendAt);
            boolean second = service.claimForSending(batch.getId(), sendAt);
            entityManager.flush();
            entityManager.clear();

            assertThat(first).isTrue();
            assertThat(second).isFalse();
            NewsBatch sending = batchRepository.findById(batch.getId()).orElseThrow();
            assertThat(sending.getStatus()).isEqualTo(NewsBatchStatus.SENDING);
            assertThat(sending.getSendStartedAt()).isEqualTo(sendAt);
            assertThat(service.findDueForSending(sendAt.plusDays(1))).doesNotContain(batch.getId());
        }

        @Test
        @DisplayName("탭에만 공개한 승인 회차는 발송 대상이 아니다")
        void tabOnlyBatchIsNeverDue() {
            NewsBatch batch = awaitingBatch();
            tabOnly(batch, "탭만 소식", "x:2");
            service.approve(batch.getId(), "U1");
            service.approve(batch.getId(), "U2");
            entityManager.flush();

            assertThat(service.findDueForSending(LocalDateTime.now().plusYears(1))).doesNotContain(batch.getId());
        }

        @Test
        @DisplayName("발송을 마치면 성공은 SENT, 결과를 알 수 없으면 FAILED 로 남기고, 발송 중이 아니면 바꾸지 않는다")
        void finishesSending() {
            NewsBatch sent = approvedBatchWithPush();
            service.claimForSending(sent.getId(), LocalDateTime.now());
            service.finishSending(sent.getId(), true);
            service.finishSending(sent.getId(), false);
            entityManager.flush();
            NewsBatch failed = approvedBatchWithPush();
            service.claimForSending(failed.getId(), LocalDateTime.now());
            service.finishSending(failed.getId(), false);
            entityManager.flush();
            entityManager.clear();

            assertThat(batchRepository.findById(sent.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.SENT);
            assertThat(batchRepository.findById(failed.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.FAILED);
        }

        @Test
        @DisplayName("발송 시각을 미루면 목록 공개 시각도 같이 미뤄서 목록이 푸시보다 먼저 보이지 않는다")
        void postponeMovesPublishTimeToo() {
            NewsBatch batch = approvedBatchWithPush();
            LocalDateTime originalSendAt = batch.getSendAt();

            service.postpone(batch.getId());
            entityManager.flush();
            entityManager.clear();

            NewsBatch postponed = batchRepository.findById(batch.getId()).orElseThrow();
            assertThat(postponed.getStatus()).isEqualTo(NewsBatchStatus.APPROVED);
            assertThat(postponed.getSendAt()).isAfterOrEqualTo(originalSendAt);
            assertThat(itemRepository.findAll()).filteredOn(item -> item.getTopic().equals(TOPIC))
                    .allSatisfy(item -> assertThat(item.getPublishedAt()).isEqualTo(postponed.getSendAt()));
            assertThat(sendPolicy.isWithinWindow(postponed.getSendAt().atZone(ZoneId.systemDefault()).toInstant())).isTrue();
        }

        @Test
        @DisplayName("발송 중으로 오래 남은 회차를 찾아 실패로 정리하고, 이미 정리했으면 다시 정리하지 않는다")
        void failsStuckSendingOnce() {
            NewsBatch batch = approvedBatchWithPush();
            LocalDateTime startedAt = LocalDateTime.now().minusHours(1);
            service.claimForSending(batch.getId(), startedAt);
            entityManager.flush();

            assertThat(service.findStuckSending(startedAt.minusMinutes(1))).doesNotContain(batch.getId());
            assertThat(service.findStuckSending(startedAt.plusMinutes(1))).contains(batch.getId());
            Optional<NewsBatch> first = service.failStuckSending(batch.getId());
            Optional<NewsBatch> again = service.failStuckSending(batch.getId());
            entityManager.flush();
            entityManager.clear();

            assertThat(first).isPresent();
            assertThat(again).isEmpty();
            assertThat(batchRepository.findById(batch.getId()).orElseThrow().getStatus()).isEqualTo(NewsBatchStatus.FAILED);
            assertThat(service.findStuckSending(startedAt.plusMinutes(1))).doesNotContain(batch.getId());
        }

        private NewsBatch approvedBatchWithPush() {
            NewsBatch batch = awaitingBatch();
            push(batch, "푸시 소식 " + batch.getId(), "x:" + (100 + batch.getId() % 1000));
            service.approve(batch.getId(), "U1");
            service.approve(batch.getId(), "U2");
            entityManager.flush();
            return batch;
        }
    }

    @Test
    @DisplayName("슬랙 메시지를 다시 그리는 데 쓰는 회차의 현재 모습: 승인한 사람과 제외한 링크를 담는다")
    void viewHasApproversAndExclusions() {
        NewsBatch batch = awaitingBatch();
        NewsCandidate push = push(batch, "푸시", "x:1");
        push(batch, "남김", "x:2");
        service.exclude(batch.getId(), push.getId(), "U3");
        service.approve(batch.getId(), "U1");
        entityManager.flush();
        entityManager.clear();

        BatchView view = service.view(batch.getId()).orElseThrow();

        assertThat(view.approverIds()).containsExactly("U1");
        assertThat(view.excludedKeys()).containsExactly("x:1");
        assertThat(view.candidates()).hasSize(2);
        assertThat(service.view(-1L)).isEmpty();
    }

    private LocalDate day(final LocalDateTime sendAt) {
        return sendAt.atZone(ZoneId.systemDefault()).withZoneSameInstant(KST).toLocalDate();
    }

    private NewsBatch awaitingBatch() {
        NewsBatch batch = batchRepository.saveAndFlush(NewsBatch.start(TOPIC, "THURSDAY", periods(), false, "chiikawa-v2.1"));
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, GrokUsage.NONE, List.of());
        batchRepository.flush();
        return batch;
    }

    private List<CollectPeriod> periods() {
        return List.of(CollectPeriod.notCollected("chiikawashop_kr", LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 12)),
                CollectPeriod.notCollected("chiikawa_kouhou", LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 12)));
    }

    private NewsCandidate push(final NewsBatch batch, final String title, final String linkKey) {
        return candidate(batch, NewsSection.KOREA_STORE, title, linkKey, FUTURE, null, true, null);
    }

    private NewsCandidate tabOnly(final NewsBatch batch, final String title, final String linkKey) {
        return candidate(batch, NewsSection.OTHER_GOODS, title, linkKey, FUTURE, null, true, null);
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
}
