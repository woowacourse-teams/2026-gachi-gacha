package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.NewsRunResult.Finished;
import com.gachi.gacha.server.news.application.dto.NewsRunResult.Stats;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.CollectTarget;
import com.gachi.gacha.server.news.domain.CollectionPlanner;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import com.gachi.gacha.server.news.infra.NewsProperties;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 수집의 DB 작업만 맡는다. 각 메서드는 짧은 트랜잭션 하나이고, Grok 호출은 하지 않는다.
 * 회차 만들기 → (트랜잭션 밖에서 Grok 호출) → 결과 저장 순서는 {@link NewsCollectService} 가 조합한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NewsBatchService {

    private final NewsBatchJpaRepository batchRepository;
    private final NewsCandidateJpaRepository candidateRepository;
    private final CollectionPlanner planner;
    private final NewsProperties properties;
    private final Clock clock;

    /**
     * 정기 수집 회차를 만든다. 이미 수집 중인 회차가 있으면 만들지 않는다.
     *
     * <p>수집 중으로 오래 남은 회차는 서버가 멈춘 것이므로 실패로 정리한다. 승인 대기 회차가 있으면 만료한다.
     */
    @Transactional
    public Optional<Started> begin(
            final String topic,
            final String runName,
            final NewsProperties.Topic config,
            final LocalDate todayUtc
    ) {
        Optional<NewsBatch> collecting = batchRepository.findByTopicAndStatus(topic, NewsBatchStatus.COLLECTING);
        if (collecting.isPresent()) {
            NewsBatch running = collecting.get();
            if (!running.isStuck(LocalDateTime.now(clock), properties.collect().stuckAfter())) {
                return Optional.empty();
            }
            log.warn("수집 중으로 오래 남은 회차를 실패로 정리한다. batchId = {}", running.getId());
            running.fail(GrokUsage.NONE, List.of("수집 중 서버가 멈춘 것으로 보여 실패 처리함"));
        }
        batchRepository.findByTopicAndStatus(topic, NewsBatchStatus.AWAITING_APPROVAL).ifPresent(NewsBatch::expire);
        // Hibernate 는 flush 할 때 INSERT 를 UPDATE 보다 먼저 실행한다. 정리·만료를 먼저 반영하지 않으면
        // 새 회차 INSERT 시점에 이전 회차가 남아 있어 주제당 진행 중 회차 1개 제약에 걸린다.
        batchRepository.flush();

        List<CollectTarget> targets = config.targetsOf(runName);
        List<CollectPeriod> periods = planner.periods(targets, batchRepository.findTop30ByTopicOrderByIdDesc(topic), todayUtc);
        NewsBatch batch = batchRepository.saveAndFlush(
                NewsBatch.start(topic, runName, periods, properties.dryRun(), config.promptVersion()));
        return Optional.of(new Started(batch.getId(), topic, runName, targets, periods));
    }

    /**
     * 수집 결과를 저장한다. 공개할 소식이 있으면 승인 대기, 없으면 새 소식 없음으로 끝낸다.
     *
     * @param collectedHandles 모든 구간을 수집한 계정. 이 계정만 다음 수집이 그 기간 뒤부터 시작한다
     */
    @Transactional
    public Finished complete(
            final Long batchId,
            final NewsPostProcessor.Result result,
            final Set<String> collectedHandles,
            final GrokUsage usage,
            final List<String> warnings,
            final int skippedPosts,
            final int discardedCount
    ) {
        NewsBatch batch = getBatch(batchId);
        List<NewsCandidate> candidates = candidateRepository.saveAll(result.all().stream()
                .map(news -> NewsCandidate.collected(batchId, news))
                .toList());
        batch.complete(collectedHandles,
                candidates.stream().anyMatch(candidate -> candidate.getReview().isPublishable()), usage, warnings);
        return new Finished(batch, candidates, new Stats(result.duplicateCount(), discardedCount, skippedPosts));
    }

    @Transactional
    public Finished fail(final Long batchId, final GrokUsage usage, final List<String> warnings) {
        NewsBatch batch = getBatch(batchId);
        batch.fail(usage, warnings);
        return new Finished(batch, List.of(), Stats.NONE);
    }

    @Transactional
    public void recordSlackMessage(final Long batchId, final String channelId, final String messageTs) {
        getBatch(batchId).recordSlackMessage(channelId, messageTs);
    }

    /**
     * 회차를 만든 결과. 트랜잭션 밖에서 Grok 을 부를 때 필요한 값만 담는다.
     */
    public record Started(
            Long batchId,
            String topic,
            String runName,
            List<CollectTarget> targets,
            List<CollectPeriod> periods
    ) {
    }

    private NewsBatch getBatch(final Long batchId) {
        return batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("없는 회차: " + batchId));
    }
}
