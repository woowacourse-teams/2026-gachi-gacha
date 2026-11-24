package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.NewsRunResult.Expired;
import com.gachi.gacha.server.news.application.dto.NewsRunResult.Finished;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.CollectTarget;
import com.gachi.gacha.server.news.domain.CollectedNews;
import com.gachi.gacha.server.news.domain.CollectionPlanner;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.domain.NewsExclusion;
import com.gachi.gacha.server.news.domain.NewsExclusionJpaRepository;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import com.gachi.gacha.server.news.infra.NewsProperties;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 수집의 DB 작업만 맡는다. 각 메서드는 짧은 트랜잭션 하나이고, Grok 호출은 하지 않는다.
 * 회차 만들기 → (트랜잭션 밖에서 Grok 호출) → 결과 저장 순서는 {@link NewsCollectService} 가 조합한다.
 *
 * <p>승인되지 않고 끝난 회차의 후보는 회차를 만들 때 새 회차로 넘긴다(이월). 수집 기간이 "마지막 성공 이후"라서
 * 넘기지 않으면 그 소식은 다시 수집되지 않고 사라진다. 새로 수집한 후보는 이미 공개했거나 사람이 제외한 링크,
 * 이월된 후보와 같은 링크이면 승인 요청에 올리지 않는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NewsBatchService {

    private final NewsBatchJpaRepository batchRepository;
    private final NewsCandidateJpaRepository candidateRepository;
    private final NewsItemJpaRepository itemRepository;
    private final NewsExclusionJpaRepository exclusionRepository;
    private final CollectionPlanner planner;
    private final NewsProperties properties;
    private final Clock clock;

    /**
     * 수집 회차를 만든다. 이미 수집 중인 회차가 있으면 만들지 않는다.
     *
     * <p>수집 중으로 오래 남은 회차는 서버가 멈춘 것이므로 실패로 정리한다. 승인 대기 회차가 있으면 만료하고,
     * 직전 회차의 넘길 수 있는 후보를 새 회차로 옮긴다.
     */
    @Transactional
    public Optional<Started> begin(
            final String topic,
            final String runName,
            final List<CollectTarget> targets,
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
        // 만료하는 순간 승인 버튼이 들어와도 한쪽만 반영되도록 행을 잠그고 찾는다
        Optional<NewsBatch> awaiting = batchRepository.findByTopicAndStatusForUpdate(topic, NewsBatchStatus.AWAITING_APPROVAL);
        awaiting.ifPresent(NewsBatch::expire);
        // Hibernate 는 flush 할 때 INSERT 를 UPDATE 보다 먼저 실행한다. 정리·만료를 먼저 반영하지 않으면
        // 새 회차 INSERT 시점에 이전 회차가 남아 있어 주제당 진행 중 회차 1개 제약에 걸린다.
        batchRepository.flush();

        List<NewsBatch> recent = batchRepository.findTop30ByTopicOrderByIdDesc(topic);
        List<CollectPeriod> periods = planner.periods(targets, recent, todayUtc);
        NewsBatch batch = batchRepository.saveAndFlush(
                NewsBatch.start(topic, runName, periods, properties.dryRun(), config.promptVersion()));
        int carried = carryOver(recent, batch);
        Expired expired = awaiting.map(previous -> new Expired(previous.getId(), carried)).orElse(null);
        return Optional.of(new Started(batch.getId(), topic, runName, targets, periods, expired));
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
        List<CollectedNews> collected = result.all();
        List<CollectedNews> kept = withoutKnownLinks(batch, collected);
        candidateRepository.saveAll(kept.stream().map(news -> NewsCandidate.collected(batchId, news)).toList());

        List<NewsCandidate> candidates = candidateRepository.findAllByBatchIdOrderByIdAsc(batchId);
        int duplicates = result.duplicateCount() + (collected.size() - kept.size());
        List<String> notes = new ArrayList<>(warnings);
        if (duplicates + discardedCount + skippedPosts > 0) {
            notes.add("제외: 중복 " + duplicates + " · 형식 오류 " + discardedCount + " · 굿즈 아님 " + skippedPosts);
        }
        batch.complete(collectedHandles,
                candidates.stream().anyMatch(candidate -> candidate.getReview().isPublishable()), usage, notes);
        return new Finished(batch, candidates, null);
    }

    @Transactional
    public Finished fail(final Long batchId, final GrokUsage usage, final List<String> warnings) {
        NewsBatch batch = getBatch(batchId);
        batch.fail(usage, warnings);
        return new Finished(batch, candidateRepository.findAllByBatchIdOrderByIdAsc(batchId), null);
    }

    @Transactional
    public void recordSlackMessage(final Long batchId, final String channelId, final String messageTs) {
        getBatch(batchId).recordSlackMessage(channelId, messageTs);
    }

    /**
     * 직전 회차의 후보를 새 회차로 옮긴다.
     * <ul>
     *   <li>직전 회차가 만료됐거나 실패한 회차면 넘길 수 있는 후보를 모두 옮긴다. 실패가 이어져도 후보가 사라지지 않는다.</li>
     *   <li>직전 회차가 [다시 수집]으로 버려진 회차면 이월로 받았던 후보만 옮긴다. 직접 수집한 후보는 같은 기간을 다시
     *       수집해서 얻는데, 이월로 받은 후보는 다시 수집해도 얻을 수 없기 때문이다.</li>
     * </ul>
     * 넘길 수 있는 후보는 링크가 검증됐고, 끝나지 않았고, 아직 공개되지 않았고, 사람이 제외하지 않은 것이다.
     * 만료된 회차에 들어온 승인 표는 옮기지 않는다.
     *
     * @return 옮긴 후보 수
     */
    private int carryOver(final List<NewsBatch> recent, final NewsBatch newBatch) {
        if (recent.isEmpty()) {
            return 0;
        }
        NewsBatch previous = recent.getFirst();
        boolean onlyCarried = previous.getStatus() == NewsBatchStatus.DISCARDED;
        if (!previous.getStatus().isCarryOverSource() && !onlyCarried) {
            return 0;
        }
        LocalDate todayKst = LocalDate.now(clock.withZone(properties.zone()));
        List<NewsCandidate> eligible = candidateRepository.findAllByBatchIdOrderByIdAsc(previous.getId()).stream()
                .filter(candidate -> !onlyCarried || candidate.getCarriedFromId() != null)
                .filter(candidate -> candidate.isCarryOverEligible(todayKst))
                .toList();
        Set<String> known = publishedOrExcludedKeys(newBatch.getTopic(), eligible.stream().map(NewsCandidate::linkKey).toList());
        List<NewsCandidate> carried = eligible.stream()
                .filter(candidate -> !known.contains(candidate.linkKey()))
                .map(candidate -> candidate.carryTo(newBatch.getId()))
                .toList();
        candidateRepository.saveAll(carried);
        return carried.size();
    }

    /**
     * 이미 공개됐거나 사람이 제외한 링크, 이월돼 이 회차에 이미 있는 링크의 소식을 뺀다.
     * 링크가 없는 소식은 같은 소식인지 알 수 없어서 그대로 둔다(확인 필요로만 보인다).
     */
    private List<CollectedNews> withoutKnownLinks(final NewsBatch batch, final List<CollectedNews> collected) {
        List<String> keys = collected.stream().map(CollectedNews::linkKey).filter(key -> !key.isEmpty()).toList();
        Set<String> known = publishedOrExcludedKeys(batch.getTopic(), keys);
        candidateRepository.findAllByBatchIdOrderByIdAsc(batch.getId()).stream()
                .map(NewsCandidate::linkKey).filter(key -> !key.isEmpty()).forEach(known::add);
        Set<String> keptKeys = new HashSet<>();
        return collected.stream()
                .filter(news -> news.linkKey().isEmpty() || (!known.contains(news.linkKey()) && keptKeys.add(news.linkKey())))
                .toList();
    }

    private Set<String> publishedOrExcludedKeys(final String topic, final List<String> linkKeys) {
        Set<String> known = new HashSet<>();
        if (linkKeys.isEmpty()) {
            return known;
        }
        known.addAll(itemRepository.findPublishedLinkKeys(topic, linkKeys));
        exclusionRepository.findAllByTopicAndLinkKeyIn(topic, linkKeys).stream()
                .map(NewsExclusion::getLinkKey).forEach(known::add);
        return known;
    }

    /**
     * 회차를 만든 결과. 트랜잭션 밖에서 Grok 을 부를 때 필요한 값만 담는다.
     *
     * @param expired 이 회차를 만들면서 만료한 승인 대기 회차. 없으면 null
     */
    public record Started(
            Long batchId,
            String topic,
            String runName,
            List<CollectTarget> targets,
            List<CollectPeriod> periods,
            @Nullable Expired expired
    ) {
    }

    private NewsBatch getBatch(final Long batchId) {
        return batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("없는 회차: " + batchId));
    }
}
