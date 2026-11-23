package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.NewsBatchService.Started;
import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.CollectCall;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.CollectTarget;
import com.gachi.gacha.server.news.domain.CollectedNews;
import com.gachi.gacha.server.news.domain.CollectionPlanner;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import com.gachi.gacha.server.news.infra.GrokResponseParser;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.news.infra.NewsPromptRenderer;
import com.gachi.gacha.server.news.infra.RetryBackoff;
import com.gachi.gacha.server.news.infra.XaiGrokClient;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

/**
 * 수집 한 번을 처음부터 끝까지 실행한다. 트랜잭션을 걸지 않는다.
 * 회차 만들기와 결과 저장은 {@link NewsBatchService} 의 짧은 트랜잭션에서 하고, 그 사이 Grok 호출은 DB 커넥션 없이 한다.
 *
 * <p>구간 하나가 실패해도 나머지 구간은 수집한다. 계정의 모든 구간이 성공했을 때만 그 계정을 수집한 것으로 기록해서,
 * 실패한 계정은 다음 수집이 같은 기간부터 다시 가져온다. 계정이 모두 실패했을 때만 회차를 실패로 남긴다.
 *
 * <p>일시 오류(타임아웃, 429, 5xx)는 2번까지 다시 시도한다. 다시 시도하는 것도 호출 수와 비용 상한에 포함하고,
 * 상한에 닿으면 남은 호출은 하지 않는다. 그 계정들은 수집하지 못한 것으로 남는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NewsCollectService {

    private static final int MAX_ATTEMPTS = 1 + RetryBackoff.MAX_RETRIES;

    private final NewsBatchService batchService;
    private final XaiGrokClient grokClient;
    private final GrokResponseParser responseParser;
    private final NewsPromptRenderer promptRenderer;
    private final NewsPostProcessor postProcessor;
    private final CollectionPlanner planner;
    private final RetryBackoff backoff;
    private final NewsProperties properties;
    private final Clock clock;

    public NewsRunResult collect(final String topic, final String runName) {
        NewsProperties.Topic config = properties.topic(topic)
                .orElseThrow(() -> new IllegalArgumentException("없는 신상 소식 주제: " + topic));
        Optional<Started> started;
        try {
            started = batchService.begin(topic, runName, config, todayUtc());
        } catch (DataIntegrityViolationException e) {
            return skipped(topic, runName, "같은 주제의 다른 수집이 동시에 시작됨");
        }
        return started.map(start -> run(config, start))
                .orElseGet(() -> skipped(topic, runName, "이미 수집 중인 회차가 있음"));
    }

    private NewsRunResult run(final NewsProperties.Topic config, final Started start) {
        log.info("신상 소식 수집 시작. topic = {}, run = {}, batchId = {}", start.topic(), start.runName(), start.batchId());
        Progress progress = new Progress();
        try {
            for (CollectCall call : planner.calls(start.targets(), start.periods())) {
                collectOne(config, call, progress);
            }
            if (progress.timedOutCalls > 0) {
                progress.warnings.add("응답을 받지 못해 비용을 알 수 없는 호출 " + progress.timedOutCalls + "건 (타임아웃)");
            }

            Set<String> collected = start.periods().stream().map(CollectPeriod::handle)
                    .filter(handle -> !progress.failedHandles.contains(handle))
                    .collect(Collectors.toSet());
            if (collected.isEmpty()) {
                return fail(start, progress, "모든 계정의 수집에 실패함");
            }
            NewsPostProcessor.Result result = postProcessor.process(progress.merged, todayKst(), config.storeHours());
            NewsRunResult.Finished finished = batchService.complete(start.batchId(), result, collected, progress.usage,
                    progress.warnings, progress.skippedPosts, progress.discarded);
            log.info("신상 소식 수집 완료. batchId = {}, 상태 = {}, 수집한 계정 = {}/{}, 비용 = ${}",
                    start.batchId(), finished.batch().getStatus(), collected.size(), start.periods().size(),
                    progress.usage.formattedCostUsd());
            return finished;
        } catch (RuntimeException e) {
            log.error("신상 소식 수집 중 예외. batchId = {}", start.batchId(), e);
            return fail(start, progress, "수집 중 예외: " + e.getClass().getSimpleName());
        }
    }

    /**
     * 호출 하나를 실행한다. 실패하면 그 계정을 실패 목록에 넣는다.
     */
    private void collectOne(final NewsProperties.Topic config, final CollectCall call, final Progress progress) {
        String handle = call.target().handle();
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            String limit = limitReached(progress.usage);
            if (limit != null) {
                progress.stop(limit);
                progress.failedHandles.add(handle);
                return;
            }
            try {
                GrokResponseParser.Result parsed = responseParser.parse(call.label(), handle, respond(config, call));
                if (parsed instanceof GrokResponseParser.Result.Failure failure) {
                    progress.usage = progress.usage.plus(failure.usage());
                    progress.fail(handle, failure.reason());
                } else {
                    GrokResponseParser.Result.Success success = (GrokResponseParser.Result.Success) parsed;
                    progress.add(success);
                    log.info("[{}] 게시물 {}건, 소식 {}건", call.label(), success.usage().postsFetched(), success.items().size());
                }
                return;
            } catch (XaiGrokClient.CallException e) {
                progress.usage = progress.usage.plus(GrokUsage.FAILED_CALL);
                progress.timedOutCalls += e.isTimedOut() ? 1 : 0;
                if (e.isRetryable() && attempt < MAX_ATTEMPTS) {
                    Duration delay = backoff.delay(attempt, e.retryAfter());
                    log.warn("{} — {}초 뒤 다시 시도 ({}/{}회)", e.getMessage(), delay.toSeconds(), attempt, MAX_ATTEMPTS - 1);
                    backoff.await(delay);
                    continue;
                }
                progress.fail(handle, e.getMessage());
                return;
            }
        }
    }

    private String respond(final NewsProperties.Topic config, final CollectCall call) {
        CollectTarget target = call.target();
        Map<String, String> variables = Map.of(
                "ipName", config.displayName(),
                "ipNameJa", config.nameJa() == null ? config.displayName() : config.nameJa(),
                "todayKst", todayKst().toString(),
                "from", call.from().toString(),
                "toLabel", call.toLabel(),
                "handle", target.handle(),
                "query", target.searchQuery());
        NewsProperties.Xai xai = properties.xai();
        log.info("[{}] Grok 호출 (기간: {} ~ {}, 웹 검색: {})", call.label(), call.from(), call.toLabel(), target.webSearch());
        return grokClient.respond(call,
                promptRenderer.system(config.promptDir(), variables),
                promptRenderer.user(config.promptDir(), variables),
                target.webSearch() ? xai.maxTurnsWithWebSearch() : xai.maxTurns());
    }

    /**
     * @return 상한에 닿았으면 보고에 남길 문구, 아니면 null
     */
    private String limitReached(final GrokUsage usage) {
        NewsProperties.Collect collect = properties.collect();
        if (usage.calls() >= collect.maxCallsPerRun()) {
            return "호출 상한(" + collect.maxCallsPerRun() + "회, 재시도 포함)에 닿아 남은 호출을 하지 않음";
        }
        if (usage.costUsd() >= collect.maxCostUsd()) {
            return String.format(Locale.ROOT, "비용 상한($%.2f)에 닿아 남은 호출을 하지 않음 (지금까지 $%s)",
                    collect.maxCostUsd(), usage.formattedCostUsd());
        }
        return null;
    }

    private NewsRunResult fail(final Started start, final Progress progress, final String reason) {
        List<String> warnings = new ArrayList<>(progress.warnings);
        warnings.add(reason);
        NewsRunResult.Finished finished = batchService.fail(start.batchId(), progress.usage, warnings);
        log.warn("신상 소식 수집 실패. batchId = {}, 원인 = {}", start.batchId(), reason);
        return finished;
    }

    private NewsRunResult skipped(final String topic, final String runName, final String reason) {
        log.warn("신상 소식 수집 건너뜀. topic = {}, run = {}, 이유 = {}", topic, runName, reason);
        return new NewsRunResult.Skipped(topic, runName, reason);
    }

    private LocalDate todayUtc() {
        return LocalDate.now(clock.withZone(ZoneOffset.UTC));
    }

    private LocalDate todayKst() {
        return LocalDate.now(clock.withZone(properties.zone()));
    }

    /**
     * 수집하는 동안 쌓이는 값. 한 번의 수집 안에서만 쓴다.
     */
    private static final class Progress {

        private GrokUsage usage = GrokUsage.NONE;
        private final List<String> warnings = new ArrayList<>();
        private final List<CollectedNews> merged = new ArrayList<>();
        private final Set<String> failedHandles = new HashSet<>();
        private int skippedPosts;
        private int discarded;
        private int timedOutCalls;
        private boolean stopped;

        private void add(final GrokResponseParser.Result.Success success) {
            usage = usage.plus(success.usage());
            merged.addAll(success.items());
            warnings.addAll(success.warnings());
            success.discarded().forEach(item -> warnings.add(item.warning()));
            skippedPosts += success.skippedPosts();
            discarded += success.discarded().size();
        }

        private void fail(final String handle, final String reason) {
            failedHandles.add(handle);
            warnings.add(reason);
        }

        /**
         * 상한에 닿은 이유는 한 번만 남긴다.
         */
        private void stop(final String reason) {
            if (!stopped) {
                stopped = true;
                warnings.add(reason);
            }
        }
    }
}
