package com.gachi.gacha.server.news.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.news.domain.exception.NewsBatchStateException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;

/**
 * 수집 회차. 수집 한 번과 그 결과의 승인·공개·발송 흐름을 관리한다. 상태 전이는 {@link NewsBatchStatus} 를 따른다.
 *
 * <p>전이 메서드는 현재 상태가 맞지 않으면 {@link NewsBatchStateException} 을 던진다.
 * 버튼을 동시에 눌러도 한 번만 반영되도록 {@link Version} 으로 낙관적 락을 건다.
 */
@Getter
@Entity
@Table(name = "news_batch")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NewsBatch extends BaseTimeEntity {

    private static final String WARNING_SEPARATOR = "\n";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String topic;

    @Column(nullable = false, length = 20)
    private String runName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NewsBatchStatus status;

    /**
     * dry-run 회차는 수집·검증·저장까지만 하고 공개와 푸시를 하지 않는다. 승인 버튼도 달지 않는다.
     */
    @Column(nullable = false)
    private boolean dryRun;

    @Column(nullable = false, length = 30)
    private String promptVersion;

    @Column(length = 30)
    private String slackChannelId;

    @Column(length = 30)
    private String slackMessageTs;

    private LocalDateTime approvedAt;

    /**
     * 푸시를 보낼 예정 시각. 목록 공개 시각도 같다. 푸시 대상이 없으면 null 이고, 이때는 승인한 시각에 바로 공개한다.
     */
    private LocalDateTime sendAt;

    /**
     * 첫 표가 들어온 뒤 [제외]·[되돌리기]를 마지막으로 누른 사람의 슬랙 회원 ID. 다음 승인자가 바뀐 내용을 보고 누르게 한다.
     */
    @Column(length = 30)
    private String changedAfterVoteBy;

    @Getter(AccessLevel.NONE)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String periods;

    @Getter(AccessLevel.NONE)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String usage;

    @Getter(AccessLevel.NONE)
    private String warnings;

    @Version
    private Long version;

    private NewsBatch(
            final String topic,
            final String runName,
            final List<CollectPeriod> periods,
            final boolean dryRun,
            final String promptVersion
    ) {
        this.topic = Objects.requireNonNull(topic, "topic");
        this.runName = Objects.requireNonNull(runName, "runName");
        this.status = NewsBatchStatus.COLLECTING;
        this.dryRun = dryRun;
        this.promptVersion = Objects.requireNonNull(promptVersion, "promptVersion");
        this.periods = NewsJsonCodec.writePeriods(periods.stream()
                .map(period -> CollectPeriod.notCollected(period.handle(), period.from(), period.to()))
                .toList());
        this.usage = NewsJsonCodec.writeUsage(GrokUsage.NONE);
    }

    public static NewsBatch start(
            final String topic,
            final String runName,
            final List<CollectPeriod> periods,
            final boolean dryRun,
            final String promptVersion
    ) {
        return new NewsBatch(topic, runName, periods, dryRun, promptVersion);
    }

    public List<CollectPeriod> periods() {
        return NewsJsonCodec.readPeriods(periods);
    }

    public GrokUsage usage() {
        return NewsJsonCodec.readUsage(usage);
    }

    public List<String> warnings() {
        if (warnings == null || warnings.isEmpty()) {
            return List.of();
        }
        return List.of(warnings.split(WARNING_SEPARATOR));
    }

    /**
     * 수집을 마친다. 일부 계정이 실패해도 성공한 계정의 후보로 회차를 이어 가고, 실패한 계정은 다음 수집이 다시 가져온다.
     *
     * @param collectedHandles 모든 구간을 수집한 계정
     * @param hasPublishable   공개할 소식(푸시 대상 또는 탭에만 공개)이 있는지
     */
    public void complete(
            final Set<String> collectedHandles,
            final boolean hasPublishable,
            final GrokUsage collectedUsage,
            final List<String> collectedWarnings
    ) {
        requireStatus(NewsBatchStatus.COLLECTING, "수집 완료 처리");
        this.status = hasPublishable ? NewsBatchStatus.AWAITING_APPROVAL : NewsBatchStatus.NO_NEWS;
        this.periods = NewsJsonCodec.writePeriods(periods().stream()
                .map(period -> collectedHandles.contains(period.handle()) ? period.markCollected() : period)
                .toList());
        recordUsage(collectedUsage, collectedWarnings);
    }

    /**
     * 모든 호출이 실패했거나, 수집 중 서버가 멈춰 수집 중 상태로 남은 회차를 정리한다. 어느 계정도 수집하지 않은 것으로 남는다.
     */
    public void fail(final GrokUsage collectedUsage, final List<String> collectedWarnings) {
        requireStatus(NewsBatchStatus.COLLECTING, "수집 실패 처리");
        this.status = NewsBatchStatus.FAILED;
        recordUsage(collectedUsage, collectedWarnings);
    }

    /**
     * 수집 중으로 남은 지 오래된 회차인지. 서버가 수집 도중 멈추면 이 상태로 남는다.
     */
    public boolean isStuck(final LocalDateTime now, final Duration stuckAfter) {
        LocalDateTime lastUpdated = getUpdatedAt() != null ? getUpdatedAt() : getCreatedAt();
        return lastUpdated != null && lastUpdated.plus(stuckAfter).isBefore(now);
    }

    /**
     * 이 회차를 알린 슬랙 메시지. 상태가 바뀔 때 같은 메시지를 다시 그리려고 기억해 둔다.
     */
    public void recordSlackMessage(final String channelId, final String messageTs) {
        this.slackChannelId = Objects.requireNonNull(channelId, "channelId");
        this.slackMessageTs = Objects.requireNonNull(messageTs, "messageTs");
    }

    /**
     * 다음 수집이 시작될 때 승인되지 않은 회차를 만료한다. dry-run 회차도 같다.
     */
    public void expire() {
        requireStatus(NewsBatchStatus.AWAITING_APPROVAL, "만료");
        this.status = NewsBatchStatus.EXPIRED;
    }

    /**
     * [다시 수집]으로 버린다. 사람이 [제외]한 것이 아니므로 제외 기록은 남기지 않는다.
     */
    public void discard() {
        requireStatus(NewsBatchStatus.AWAITING_APPROVAL, "다시 수집");
        this.status = NewsBatchStatus.DISCARDED;
    }

    /**
     * 승인 표가 모였다. 이 전이는 한 번만 일어난다.
     *
     * @param pushSendAt 푸시 발송 예정 시각. 푸시 대상이 없으면 null
     */
    public void approve(final LocalDateTime now, @Nullable final LocalDateTime pushSendAt) {
        requireStatus(NewsBatchStatus.AWAITING_APPROVAL, "승인");
        this.status = NewsBatchStatus.APPROVED;
        this.approvedAt = Objects.requireNonNull(now, "now");
        this.sendAt = pushSendAt;
    }

    /**
     * 승인 대기 중에 소식을 제외하거나 되돌렸다. 이미 들어온 표가 있으면 다음 승인자에게 변경이 있었다고 알린다.
     */
    public void markChangedAfterVote(final String slackUserId) {
        requireStatus(NewsBatchStatus.AWAITING_APPROVAL, "소식 변경");
        this.changedAfterVoteBy = Objects.requireNonNull(slackUserId, "slackUserId");
    }

    private void recordUsage(final GrokUsage collectedUsage, final List<String> collectedWarnings) {
        this.usage = NewsJsonCodec.writeUsage(collectedUsage);
        List<String> all = new ArrayList<>(warnings());
        collectedWarnings.stream().map(this::singleLine).forEach(all::add);
        this.warnings = all.isEmpty() ? null : String.join(WARNING_SEPARATOR, all);
    }

    /**
     * 경고는 한 줄에 하나씩 저장하므로 경고 안의 줄바꿈은 공백으로 바꾼다.
     */
    private String singleLine(final String warning) {
        return warning.replace('\n', ' ').replace('\r', ' ');
    }

    private void requireStatus(final NewsBatchStatus expected, final String action) {
        if (status != expected) {
            throw new NewsBatchStateException(status, action);
        }
    }
}
