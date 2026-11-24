package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.BatchView;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.NewsApproval;
import com.gachi.gacha.server.news.domain.NewsApprovalJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.domain.NewsExclusion;
import com.gachi.gacha.server.news.domain.NewsExclusionJpaRepository;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsSendPolicy;
import com.gachi.gacha.server.news.infra.NewsProperties;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 슬랙 버튼이 일으키는 상태 변화의 DB 작업. 제외·되돌리기, 승인(표 모으기와 공개), 다시 수집(회차 버리기)을 한다.
 * 슬랙 호출은 하지 않는다. 호출하는 쪽이 트랜잭션이 끝난 뒤에 메시지를 다시 그린다.
 *
 * <p>모든 메서드는 회차 행을 잠그고 시작한다. 같은 회차에 버튼이 동시에 들어와도 한 줄로 처리돼서,
 * 두 명이 동시에 [승인]을 눌러도 표가 서로 보이고 승인·공개는 한 번만 일어난다.
 * 승인 대기 상태가 아니거나 dry-run 회차면 아무것도 바꾸지 않는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NewsApprovalService {

    private final NewsBatchJpaRepository batchRepository;
    private final NewsCandidateJpaRepository candidateRepository;
    private final NewsApprovalJpaRepository approvalRepository;
    private final NewsExclusionJpaRepository exclusionRepository;
    private final NewsItemJpaRepository itemRepository;
    private final NewsSendPolicy sendPolicy;
    private final NewsProperties properties;
    private final Clock clock;

    /**
     * 소식을 제외한다. 그 링크는 공개도 푸시도 하지 않고 다음 수집에서 다시 올라오지도 않는다.
     */
    @Transactional
    public Result exclude(final Long batchId, final Long candidateId, final String slackUserId) {
        return changeExclusion(batchId, candidateId, slackUserId, true);
    }

    @Transactional
    public Result undoExclusion(final Long batchId, final Long candidateId, final String slackUserId) {
        return changeExclusion(batchId, candidateId, slackUserId, false);
    }

    private Result changeExclusion(final Long batchId, final Long candidateId, final String slackUserId, final boolean exclude) {
        Optional<NewsBatch> locked = batchRepository.findByIdForUpdate(batchId);
        if (locked.isEmpty()) {
            return Result.NOT_FOUND;
        }
        NewsBatch batch = locked.get();
        if (!isOpen(batch)) {
            return Result.NOT_AWAITING;
        }
        Optional<NewsCandidate> candidate = candidateRepository.findById(candidateId)
                .filter(found -> batchId.equals(found.getBatchId()))
                .filter(found -> found.getReview().isPublishable());
        if (candidate.isEmpty()) {
            return Result.NOT_FOUND;
        }
        String topic = batch.getTopic();
        String linkKey = candidate.get().linkKey();
        boolean excluded = exclusionRepository.existsByTopicAndLinkKey(topic, linkKey);
        if (excluded == exclude) {
            return Result.NO_CHANGE;
        }
        if (exclude) {
            exclusionRepository.save(new NewsExclusion(topic, linkKey, slackUserId));
        } else {
            exclusionRepository.deleteByTopicAndLinkKey(topic, linkKey);
        }
        if (!approvalRepository.findAllByBatchIdOrderByIdAsc(batchId).isEmpty()) {
            batch.markChangedAfterVote(slackUserId);
        }
        return Result.DONE;
    }

    /**
     * 승인 표를 하나 더한다. 같은 사람이 다시 눌러도 1표다. 서로 다른 N명이 모이면 승인 대기 → 승인됨으로 한 번만 바꾸고,
     * 그 순간의 후보 상태로 소식을 공개한다. 표가 들어온 뒤의 [제외]·[되돌리기]는 이미 들어온 표를 지우지 않는다.
     */
    @Transactional
    public Vote approve(final Long batchId, final String slackUserId) {
        Optional<NewsBatch> locked = batchRepository.findByIdForUpdate(batchId);
        if (locked.isEmpty()) {
            return new Vote(VoteStatus.NOT_FOUND, 0);
        }
        NewsBatch batch = locked.get();
        if (!isOpen(batch)) {
            return new Vote(VoteStatus.NOT_AWAITING, 0);
        }
        boolean alreadyVoted = approvalRepository.existsByBatchIdAndSlackUserId(batchId, slackUserId);
        if (!alreadyVoted) {
            approvalRepository.save(new NewsApproval(batchId, slackUserId));
        }
        int votes = approvalRepository.findAllByBatchIdOrderByIdAsc(batchId).size();
        if (votes < properties.requiredApprovals()) {
            return new Vote(alreadyVoted ? VoteStatus.ALREADY_VOTED : VoteStatus.VOTED, votes);
        }
        publish(batch);
        return new Vote(VoteStatus.APPROVED, votes);
    }

    /**
     * [다시 수집]으로 이 회차를 버린다. 사람이 제외한 것이 아니므로 제외 기록은 남기지 않고, 같은 기간을 다시 수집한다.
     *
     * @return 버렸으면 다시 수집할 주제와 계정. 이미 승인됐거나 만료됐으면 비어 있다
     */
    @Transactional
    public Optional<Discarded> discard(final Long batchId) {
        Optional<NewsBatch> locked = batchRepository.findByIdForUpdate(batchId).filter(this::isOpen);
        locked.ifPresent(NewsBatch::discard);
        return locked.map(batch -> new Discarded(batch.getTopic(),
                batch.periods().stream().map(CollectPeriod::handle).toList()));
    }

    /**
     * 슬랙 메시지를 다시 그릴 때 필요한 회차의 현재 모습.
     */
    @Transactional(readOnly = true)
    public Optional<BatchView> view(final Long batchId) {
        return batchRepository.findById(batchId).map(batch -> {
            List<NewsCandidate> candidates = candidateRepository.findAllByBatchIdOrderByIdAsc(batchId);
            List<String> linkKeys = candidates.stream().map(NewsCandidate::linkKey).filter(key -> !key.isEmpty()).toList();
            Set<String> excluded = linkKeys.isEmpty() ? Set.of()
                    : exclusionRepository.findAllByTopicAndLinkKeyIn(batch.getTopic(), linkKeys).stream()
                            .map(NewsExclusion::getLinkKey).collect(Collectors.toSet());
            List<String> approvers = approvalRepository.findAllByBatchIdOrderByIdAsc(batchId).stream()
                    .map(NewsApproval::getSlackUserId).toList();
            return new BatchView(batch, candidates, approvers, excluded);
        });
    }

    /**
     * 승인된 회차의 소식을 공개한다. 푸시 대상이 있으면 발송 예정 시각에, 없으면 지금 공개한다.
     * 푸시와 목록 공개 시각을 같게 두려고 발송 예정 시각을 여기서 정하고, 하루·주 상한도 이때 반영한다.
     */
    private void publish(final NewsBatch batch) {
        Long batchId = batch.getId();
        String topic = batch.getTopic();
        LocalDate todayKst = LocalDate.now(clock.withZone(properties.zone()));
        List<NewsCandidate> candidates = candidateRepository.findAllByBatchIdOrderByIdAsc(batchId).stream()
                .filter(candidate -> candidate.getReview().isPublishable())
                .toList();
        List<String> linkKeys = candidates.stream().map(NewsCandidate::linkKey).toList();
        Set<String> blocked = linkKeys.isEmpty() ? Set.of() : exclusionRepository.findAllByTopicAndLinkKeyIn(topic, linkKeys).stream()
                .map(NewsExclusion::getLinkKey).collect(Collectors.toSet());
        Set<String> alreadyPublished = linkKeys.isEmpty() ? Set.of() : Set.copyOf(itemRepository.findPublishedLinkKeys(topic, linkKeys));
        // 수집한 뒤 승인까지 시간이 걸려서 그 사이에 끝난 소식은 공개하지 않는다
        List<NewsCandidate> publishable = candidates.stream()
                .filter(candidate -> !blocked.contains(candidate.linkKey()))
                .filter(candidate -> !alreadyPublished.contains(candidate.linkKey()))
                .filter(candidate -> !candidate.isEndedOn(todayKst))
                .toList();

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime sendAt = publishable.stream().anyMatch(NewsCandidate::isPushTarget) ? nextSendAt(topic) : null;
        batch.approve(now, sendAt);
        LocalDateTime publishedAt = sendAt != null ? sendAt : now;
        itemRepository.saveAll(publishable.stream().map(candidate -> NewsItem.publish(topic, candidate, publishedAt)).toList());
        log.info("신상 소식 승인. batchId = {}, 공개 {}건, 발송 예정 = {}", batchId, publishable.size(), sendAt);
    }

    /**
     * 허용 시간과 하루·주 상한을 지키는 가장 이른 발송 시각. 시각 컬럼은 서버 기본 시간대로 저장한다.
     */
    private LocalDateTime nextSendAt(final String topic) {
        Instant now = clock.instant();
        LocalDate monday = LocalDate.now(clock.withZone(properties.zone())).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime weekStart = LocalDateTime.ofInstant(monday.atStartOfDay(properties.zone()).toInstant(), clock.getZone());
        List<Instant> scheduled = batchRepository.findSendAtFrom(topic, weekStart).stream()
                .map(sendAt -> sendAt.atZone(clock.getZone()).toInstant())
                .toList();
        return LocalDateTime.ofInstant(sendPolicy.nextSendAt(now, scheduled), clock.getZone());
    }

    private boolean isOpen(final NewsBatch batch) {
        return batch.getStatus() == NewsBatchStatus.AWAITING_APPROVAL && !batch.isDryRun();
    }

    /**
     * 제외·되돌리기 결과.
     */
    public enum Result {
        DONE,
        /** 이미 그 상태라 바뀐 것이 없다 */
        NO_CHANGE,
        /** 승인되었거나 만료되었거나 버려진 회차라 바꿀 수 없다 */
        NOT_AWAITING,
        NOT_FOUND
    }

    public enum VoteStatus {
        VOTED,
        ALREADY_VOTED,
        /** 이 표로 승인이 됐다 */
        APPROVED,
        NOT_AWAITING,
        NOT_FOUND
    }

    /**
     * @param votes 이 요청까지 반영한 승인 표 수
     */
    public record Vote(VoteStatus status, int votes) {
    }

    public record Discarded(String topic, List<String> handles) {
    }
}
