package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.news.domain.exception.NewsBatchStateException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.test.util.ReflectionTestUtils;

class NewsBatchTest {

    private static final LocalDate FROM = LocalDate.of(2026, 11, 9);
    private static final LocalDate TO = LocalDate.of(2026, 11, 12);
    private static final GrokUsage USAGE = new GrokUsage(3, 1, 12, 0, 30000, 3000, 90_000_000);

    @Test
    @DisplayName("수집 중으로 시작하고, 넘겨받은 기간은 모두 수집하지 않은 것으로 저장한다")
    void startsCollecting() {
        NewsBatch batch = NewsBatch.start("CHIIKAWA", "THURSDAY", List.of(
                new CollectPeriod("chiikawashop_kr", FROM, TO, true),
                CollectPeriod.notCollected("chiikawa_kouhou", LocalDate.of(2026, 11, 5), TO)), true, "chiikawa-v2");

        assertThat(batch.getStatus()).isEqualTo(NewsBatchStatus.COLLECTING);
        assertThat(batch.isDryRun()).isTrue();
        assertThat(batch.getPromptVersion()).isEqualTo("chiikawa-v2");
        assertThat(batch.periods()).extracting(CollectPeriod::collected).containsExactly(false, false);
        assertThat(batch.usage()).isEqualTo(GrokUsage.NONE);
        assertThat(batch.warnings()).isEmpty();
    }

    @Test
    @DisplayName("보낸 슬랙 메시지를 기억해 두고 다시 그릴 때 쓴다")
    void recordsSlackMessage() {
        NewsBatch batch = twoAccounts();

        batch.recordSlackMessage("C0NEWS", "1731382200.000100");

        assertThat(batch.getSlackChannelId()).isEqualTo("C0NEWS");
        assertThat(batch.getSlackMessageTs()).isEqualTo("1731382200.000100");
    }

    @Test
    @DisplayName("수집 중으로 6시간 넘게 갱신되지 않은 회차만 서버가 멈춘 것으로 본다")
    void isStuckAfterThreshold() {
        NewsBatch batch = twoAccounts();
        ReflectionTestUtils.setField(batch, "updatedAt", LocalDateTime.of(2026, 11, 12, 12, 30));
        Duration stuckAfter = Duration.ofHours(6);

        assertThat(batch.isStuck(LocalDateTime.of(2026, 11, 12, 18, 30), stuckAfter)).isFalse();
        assertThat(batch.isStuck(LocalDateTime.of(2026, 11, 12, 18, 31), stuckAfter)).isTrue();
    }

    @Test
    @DisplayName("갱신 시각이 아직 없는 새 회차는 만든 시각을 기준으로 보고, 둘 다 없으면 멈춘 것으로 보지 않는다")
    void stuckFallsBackToCreatedAt() {
        NewsBatch batch = twoAccounts();
        LocalDateTime later = LocalDateTime.of(2026, 11, 20, 0, 0);

        assertThat(batch.isStuck(later, Duration.ofHours(6))).isFalse();

        ReflectionTestUtils.setField(batch, "createdAt", LocalDateTime.of(2026, 11, 12, 0, 0));
        assertThat(batch.isStuck(later, Duration.ofHours(6))).isTrue();
    }

    @Nested
    @DisplayName("수집 완료")
    class Complete {

        @Test
        @DisplayName("공개할 소식이 있으면 승인 대기가 되고, 모든 구간을 수집한 계정만 수집 성공으로 남긴다")
        void awaitsApprovalAndMarksCollectedHandles() {
            NewsBatch batch = twoAccounts();

            batch.complete(Set.of("chiikawashop_kr"), true, USAGE, List.of("[JP_kouhou_2026-11-05] HTTP 503"));

            assertThat(batch.getStatus()).isEqualTo(NewsBatchStatus.AWAITING_APPROVAL);
            assertThat(batch.periods()).containsExactly(
                    new CollectPeriod("chiikawashop_kr", FROM, TO, true),
                    CollectPeriod.notCollected("chiikawa_kouhou", LocalDate.of(2026, 11, 5), TO));
            assertThat(batch.usage()).isEqualTo(USAGE);
            assertThat(batch.warnings()).containsExactly("[JP_kouhou_2026-11-05] HTTP 503");
        }

        @Test
        @DisplayName("공개할 소식이 없으면 새 소식 없음으로 끝난다")
        void noNews() {
            NewsBatch batch = twoAccounts();

            batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), false, USAGE, List.of());

            assertThat(batch.getStatus()).isEqualTo(NewsBatchStatus.NO_NEWS);
            assertThat(batch.periods()).allMatch(CollectPeriod::collected);
        }

        @Test
        @DisplayName("경고 안의 줄바꿈은 공백으로 바꿔 한 줄에 하나씩 저장한다")
        void storesWarningsOnePerLine() {
            NewsBatch batch = twoAccounts();

            batch.complete(Set.of(), true, USAGE, List.of("첫 줄\n둘째 줄", "다음 경고"));

            assertThat(batch.warnings()).containsExactly("첫 줄 둘째 줄", "다음 경고");
        }
    }

    @Test
    @DisplayName("실패하면 어느 계정도 수집하지 않은 것으로 남고, 다음 수집이 후보를 넘겨받는 회차가 된다")
    void fails() {
        NewsBatch batch = twoAccounts();

        batch.fail(GrokUsage.FAILED_CALL, List.of("모든 호출 실패"));

        assertThat(batch.getStatus()).isEqualTo(NewsBatchStatus.FAILED);
        assertThat(batch.periods()).noneMatch(CollectPeriod::collected);
        assertThat(batch.getStatus().isCarryOverSource()).isTrue();
    }

    @Test
    @DisplayName("승인 대기 회차는 다음 수집 때 만료되어 후보를 넘겨주고, [다시 수집]으로 버리면 넘겨주지 않는다")
    void expiresOrDiscards() {
        NewsBatch expired = awaiting();
        NewsBatch discarded = awaiting();

        expired.expire();
        discarded.discard();

        assertThat(expired.getStatus()).isEqualTo(NewsBatchStatus.EXPIRED);
        assertThat(expired.getStatus().isCarryOverSource()).isTrue();
        assertThat(discarded.getStatus()).isEqualTo(NewsBatchStatus.DISCARDED);
        assertThat(discarded.getStatus().isCarryOverSource()).isFalse();
    }

    @ParameterizedTest
    @EnumSource(value = NewsBatchStatus.class, names = {"NO_NEWS", "FAILED", "EXPIRED", "DISCARDED"})
    @DisplayName("끝난 회차는 다시 완료·실패·만료·버림 처리할 수 없다")
    void rejectsTransitionsFromFinishedStatus(final NewsBatchStatus finished) {
        NewsBatch batch = inStatus(finished);

        assertThatThrownBy(() -> batch.complete(Set.of(), true, USAGE, List.of()))
                .isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(() -> batch.fail(USAGE, List.of())).isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(batch::expire).isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(batch::discard).isInstanceOf(NewsBatchStateException.class);
    }

    @Test
    @DisplayName("수집 중인 회차는 만료하거나 버릴 수 없다")
    void collectingCannotExpireOrDiscard() {
        NewsBatch batch = twoAccounts();

        assertThatThrownBy(batch::expire)
                .isInstanceOf(NewsBatchStateException.class)
                .hasMessageContaining("COLLECTING");
        assertThatThrownBy(batch::discard).isInstanceOf(NewsBatchStateException.class);
    }

    @Test
    @DisplayName("승인하면 승인됨이 되고 승인 시각과 발송 예정 시각이 남으며, 한 번만 승인된다. 승인된 회차는 이월하지 않는다")
    void approvesOnce() {
        NewsBatch batch = awaiting();
        LocalDateTime now = LocalDateTime.of(2026, 11, 12, 10, 0);

        batch.approve(now, now.plusHours(1));

        assertThat(batch.getStatus()).isEqualTo(NewsBatchStatus.APPROVED);
        assertThat(batch.getApprovedAt()).isEqualTo(now);
        assertThat(batch.getSendAt()).isEqualTo(now.plusHours(1));
        assertThat(batch.getStatus().isCarryOverSource()).isFalse();
        assertThatThrownBy(() -> batch.approve(now, null)).isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(batch::expire).isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(batch::discard).isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(() -> batch.markChangedAfterVote("U1")).isInstanceOf(NewsBatchStateException.class);
    }

    @Test
    @DisplayName("푸시 대상이 없으면 발송 예정 시각 없이 승인된다")
    void approvesWithoutSendAt() {
        NewsBatch batch = awaiting();

        batch.approve(LocalDateTime.of(2026, 11, 12, 10, 0), null);

        assertThat(batch.getSendAt()).isNull();
    }

    @ParameterizedTest
    @EnumSource(value = NewsBatchStatus.class, names = {"NO_NEWS", "FAILED", "EXPIRED", "DISCARDED"})
    @DisplayName("승인 대기가 아닌 회차는 승인하거나 소식을 바꿀 수 없다")
    void onlyAwaitingBatchCanBeApprovedOrChanged(final NewsBatchStatus status) {
        NewsBatch batch = inStatus(status);

        assertThatThrownBy(() -> batch.approve(LocalDateTime.now(), null)).isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(() -> batch.markChangedAfterVote("U1")).isInstanceOf(NewsBatchStateException.class);
    }

    @Test
    @DisplayName("수집 중인 회차는 승인할 수 없다")
    void collectingCannotBeApproved() {
        assertThatThrownBy(() -> twoAccounts().approve(LocalDateTime.now(), null)).isInstanceOf(NewsBatchStateException.class);
    }

    @Test
    @DisplayName("표가 들어온 뒤 소식을 바꾼 사람은 마지막 한 명만 기억한다")
    void remembersLastChanger() {
        NewsBatch batch = awaiting();

        batch.markChangedAfterVote("U1");
        batch.markChangedAfterVote("U2");

        assertThat(batch.getChangedAfterVoteBy()).isEqualTo("U2");
    }

    @Test
    @DisplayName("승인된 회차는 발송 중으로 표시하고, 발송을 마치면 성공(SENT) 또는 결과를 알 수 없는 실패(FAILED)가 된다")
    void sendingLifecycle() {
        NewsBatch sent = approvedWithSendAt();
        NewsBatch failed = approvedWithSendAt();
        LocalDateTime now = LocalDateTime.of(2026, 11, 13, 8, 1);

        sent.startSending(now);
        failed.startSending(now);
        assertThat(sent.getStatus()).isEqualTo(NewsBatchStatus.SENDING);
        assertThat(sent.getSendStartedAt()).isEqualTo(now);
        sent.finishSending(true);
        failed.finishSending(false);

        assertThat(sent.getStatus()).isEqualTo(NewsBatchStatus.SENT);
        assertThat(failed.getStatus()).isEqualTo(NewsBatchStatus.FAILED);
        assertThat(failed.getApprovedAt()).isNotNull();
        assertThat(sent.getStatus().isCarryOverSource()).isFalse();
    }

    @Test
    @DisplayName("발송은 한 번만 시작하고, 발송 중이 아닌 회차는 끝낼 수 없다")
    void sendingTransitionsAreGuarded() {
        NewsBatch batch = approvedWithSendAt();

        assertThatThrownBy(() -> batch.finishSending(true)).isInstanceOf(NewsBatchStateException.class);
        batch.startSending(LocalDateTime.of(2026, 11, 13, 8, 1));
        assertThatThrownBy(() -> batch.startSending(LocalDateTime.of(2026, 11, 13, 8, 2))).isInstanceOf(NewsBatchStateException.class);
        batch.finishSending(true);
        assertThatThrownBy(() -> batch.finishSending(false)).isInstanceOf(NewsBatchStateException.class);
        assertThatThrownBy(() -> awaiting().startSending(LocalDateTime.now())).isInstanceOf(NewsBatchStateException.class);
    }

    @Test
    @DisplayName("발송 시각은 승인됐고 아직 발송하지 않은 회차만 미룰 수 있다")
    void postponesOnlyApprovedBatchWithSendAt() {
        NewsBatch batch = approvedWithSendAt();
        NewsBatch tabOnly = awaiting();
        tabOnly.approve(LocalDateTime.of(2026, 11, 12, 22, 0), null);

        batch.postpone(LocalDateTime.of(2026, 11, 14, 8, 0));

        assertThat(batch.getSendAt()).isEqualTo(LocalDateTime.of(2026, 11, 14, 8, 0));
        assertThatThrownBy(() -> tabOnly.postpone(LocalDateTime.of(2026, 11, 14, 8, 0))).isInstanceOf(NewsBatchStateException.class);
        batch.startSending(LocalDateTime.of(2026, 11, 14, 8, 1));
        assertThatThrownBy(() -> batch.postpone(LocalDateTime.of(2026, 11, 15, 8, 0))).isInstanceOf(NewsBatchStateException.class);
    }

    private NewsBatch approvedWithSendAt() {
        NewsBatch batch = awaiting();
        batch.approve(LocalDateTime.of(2026, 11, 12, 22, 0), LocalDateTime.of(2026, 11, 13, 8, 0));
        return batch;
    }

    private NewsBatch twoAccounts() {
        return NewsBatch.start("CHIIKAWA", "THURSDAY", List.of(
                CollectPeriod.notCollected("chiikawashop_kr", FROM, TO),
                CollectPeriod.notCollected("chiikawa_kouhou", LocalDate.of(2026, 11, 5), TO)), false, "chiikawa-v2");
    }

    private NewsBatch awaiting() {
        NewsBatch batch = twoAccounts();
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());
        return batch;
    }

    private NewsBatch inStatus(final NewsBatchStatus status) {
        NewsBatch batch = twoAccounts();
        switch (status) {
            case NO_NEWS -> batch.complete(Set.of(), false, USAGE, List.of());
            case FAILED -> batch.fail(USAGE, List.of());
            case EXPIRED -> {
                batch.complete(Set.of(), true, USAGE, List.of());
                batch.expire();
            }
            case DISCARDED -> {
                batch.complete(Set.of(), true, USAGE, List.of());
                batch.discard();
            }
            default -> throw new IllegalArgumentException(status.name());
        }
        return batch;
    }
}
