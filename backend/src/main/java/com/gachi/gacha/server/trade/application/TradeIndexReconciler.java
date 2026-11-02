package com.gachi.gacha.server.trade.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.exception.TradeIndexingException;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TradeIndexReconciler {

    private static final int BATCH_SIZE = 500;
    private static final int ORPHAN_PAGE_SIZE = 1_000;
    private static final Duration STARTUP_LOOKBACK = Duration.ofHours(24);
    private static final Duration OVERLAP = Duration.ofMinutes(2);

    private volatile LocalDateTime lastSyncedAt;

    private final ElasticsearchClient esClient;
    private final TradeIndexService tradeIndexService;
    private final TradeJpaRepository tradeJpaRepository;

    @Value("${elasticsearch.index.trade}")
    private String INDEX;

    public void reconcile() {
        long lastId = 0L;
        int indexed = 0;
        int deleted = 0;
        int failedBatches = 0;
        int batchNo = 0;

        while (true) {
            List<Long> ids = tradeJpaRepository.findIdsAfter(lastId, PageRequest.of(0, BATCH_SIZE));
            if (ids.isEmpty()) {
                break;
            }
            long batchMax = ids.get(ids.size() - 1);
            batchNo++;
            try {
                tradeIndexService.indexAll(ids);                              // DB → ES 덮어쓰기
                indexed += ids.size();
                deleted += deleteOrphans(lastId, batchMax, Set.copyOf(ids)); // ES에만 있는 문서 제거
            } catch (Exception e) {
                failedBatches++;
                log.error("trade 정합성 점검 배치 실패 batch={} idRange=({}, {}] size={} firstId={} lastId={}",
                        batchNo, lastId, batchMax, ids.size(), ids.get(0), batchMax, e);
            }
            lastId = batchMax;
        }

        try {
            deleted += deleteOrphans(lastId, null, Set.of());                // 마지막 ID 초과 구간
        } catch (Exception e) {
            failedBatches++;
            log.error("trade 끝 구간 고아 정리 실패 afterId={}", lastId, e);
        }

        logReconcileResult(batchNo, failedBatches, indexed, deleted);
    }

    private void logReconcileResult(final int batchNo, final int failedBatches, final int indexed, final int deleted) {
        log.info("trade 정합성 점검 종료 batches={} failedBatches={} indexed={} orphanDeleted={}",
                batchNo, failedBatches, indexed, deleted);
        if (failedBatches > 0) {
            log.warn("trade 정합성 점검에서 실패한 배치가 있습니다. 다음 실행에서 재시도됩니다. failedBatches={}", failedBatches);
        }
    }

    public void syncRecent() {
        LocalDateTime startedAt = LocalDateTime.now();
        LocalDateTime base = lastSyncedAt != null ? lastSyncedAt : startedAt.minus(STARTUP_LOOKBACK);
        LocalDateTime since = base.minus(OVERLAP);

        List<Long> ids = tradeJpaRepository.findIdsModifiedAfter(since);
        boolean success = ids.isEmpty() || syncAllSince(ids, since);
        if (success) {
            lastSyncedAt = startedAt;
        }
    }

    private boolean syncAllSince(final List<Long> ids, final LocalDateTime since) {
        int synced = 0;
        int failedBatches = 0;
        for (int i = 0; i < ids.size(); i += BATCH_SIZE) {
            List<Long> batch = ids.subList(i, Math.min(i + BATCH_SIZE, ids.size()));
            try {
                tradeIndexService.indexAll(batch);
                synced += batch.size();
            } catch (Exception e) {
                failedBatches++;
                log.error("trade 증분 동기화 배치 실패 since={} total={} synced={} firstId={} lastId={} size={}",
                        since, ids.size(), synced, batch.get(0), batch.get(batch.size() - 1), batch.size(), e);
            }
        }
        log.info("trade 증분 동기화 종료 since={} total={} synced={} failedBatches={}",
                since, ids.size(), synced, failedBatches);
        return failedBatches == 0;
    }

    private int deleteOrphans(final long greaterThan, final Long lessThanOrEqual, final Set<Long> knownIds) throws IOException {
        int deleted = 0;
        long cursor = greaterThan;

        while (true) {
            List<Long> pageIds = findIndexedIdsPage(cursor, lessThanOrEqual);
            if (pageIds.isEmpty()) {
                break;
            }
            long next = pageIds.get(pageIds.size() - 1);
            if (next <= cursor) {
                log.warn("trade 고아 정리 커서가 전진하지 않아 중단합니다. cursor={} next={}", cursor, next);
                break;
            }
            cursor = next;

            deleted += deleteOrphansInPage(pageIds, knownIds);
            if (pageIds.size() < ORPHAN_PAGE_SIZE) {
                break;
            }
        }
        return deleted;
    }

    private int deleteOrphansInPage(final List<Long> pageIds, final Set<Long> knownIds) throws IOException {
        List<Long> candidates = pageIds.stream()
                .filter(id -> !knownIds.contains(id))
                .toList();
        if (candidates.isEmpty()) {
            return 0;
        }
        List<Long> orphans = excludeExistingInDb(candidates);
        if (orphans.isEmpty()) {
            return 0;
        }
        return deleteFromIndex(orphans);
    }

    private List<Long> findIndexedIdsPage(final long greaterThan, final Long lessThanOrEqual)
            throws IOException {
        SearchResponse<Void> res = esClient.search(s -> s
                .index(INDEX)
                .size(ORPHAN_PAGE_SIZE)
                .source(src -> src.fetch(false))      // ID만 필요
                .sort(so -> so.field(f -> f.field("tradeId").order(SortOrder.Asc)))
                .query(q -> q.range(r -> r.number(n -> {
                    n.field("tradeId").gt((double) greaterThan);
                    if (lessThanOrEqual != null) {
                        n.lte(lessThanOrEqual.doubleValue());
                    }
                    return n;
                }))), Void.class);

        return res.hits().hits().stream()
                .map(h -> Long.valueOf(h.id()))
                .toList();
    }

    private List<Long> excludeExistingInDb(final List<Long> candidates) {
        Set<Long> existing = tradeJpaRepository.findAllById(candidates).stream()
                .map(Trade::getId)
                .collect(Collectors.toSet());
        return candidates.stream().filter(id -> !existing.contains(id)).toList();
    }

    private int deleteFromIndex(final List<Long> orphans) throws IOException {
        BulkRequest.Builder br = new BulkRequest.Builder();
        orphans.forEach(id -> br.operations(op -> op.delete(d -> d.index(INDEX).id(String.valueOf(id)))));
        BulkResponse res = esClient.bulk(br.build());
        if (res.errors()) {
            List<String> failed = res.items().stream()
                    .filter(i -> i.error() != null)
                    .map(i -> "id=" + i.id() + " status=" + i.status()
                            + " type=" + i.error().type() + " reason=" + i.error().reason())
                    .toList();
            throw new TradeIndexingException(ErrorCode.ELASTICSEARCH_INDEX_FAILED,
                    "고아 문서 삭제 실패 requested=" + orphans.size() + " failed=" + failed.size()
                            + " items=" + failed.stream().limit(20).collect(Collectors.joining(", "))
                            + (failed.size() > 20 ? " ..." : ""));
        }
        return orphans.size();
    }
}
