package com.gachi.gacha.server.trade.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import java.io.IOException;
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
    private static final int ORPHAN_SCAN_SIZE = 10_000;   // max_result_window 이내

    private final ElasticsearchClient esClient;
    private final TradeIndexService tradeIndexService;
    private final TradeJpaRepository tradeJpaRepository;

    @Value("${elasticsearch.index.trade}")
    private String INDEX;

    public void reconcile() throws IOException {
        long lastId = 0L;
        int indexed = 0;
        int deleted = 0;

        while (true) {
            List<Long> ids = tradeJpaRepository.findIdsAfter(lastId, PageRequest.of(0, BATCH_SIZE));
            if (ids.isEmpty()) {
                break;
            }
            long batchMax = ids.get(ids.size() - 1);

            tradeIndexService.indexAll(ids);                              // DB → ES 덮어쓰기
            deleted += deleteOrphans(lastId, batchMax, Set.copyOf(ids)); // ES에만 있는 문서 제거

            indexed += ids.size();
            lastId = batchMax;
        }
        deleted += deleteOrphans(lastId, null, Set.of());                // 마지막 ID 초과 구간

        log.info("trade 정합성 점검 완료 indexed={} orphanDeleted={}", indexed, deleted);
    }

    private int deleteOrphans(final long greaterThan, final Long lessThanOrEqual, final Set<Long> knownIds) throws IOException {
        SearchResponse<Void> res = esClient.search(s -> s
                .index(INDEX)
                .size(ORPHAN_SCAN_SIZE)
                .source(src -> src.fetch(false))      // ID만 필요
                .query(q -> q.range(r -> r.number(n -> {
                    n.field("tradeId").gt((double) greaterThan);
                    if (lessThanOrEqual != null) {
                        n.lte(lessThanOrEqual.doubleValue());
                    }
                    return n;
                }))), Void.class);

        List<Long> candidates = res.hits().hits().stream()
                .map(h -> Long.valueOf(h.id()))
                .filter(id -> !knownIds.contains(id))
                .toList();
        if (candidates.isEmpty()) {
            return 0;
        }

        // 스냅샷 이후 새로 생긴 글을 지우지 않도록 DB에서 한 번 더 확인
        Set<Long> existing = tradeJpaRepository.findAllById(candidates).stream()
                .map(Trade::getId)
                .collect(Collectors.toSet());
        List<Long> orphans = candidates.stream().filter(id -> !existing.contains(id)).toList();
        if (orphans.isEmpty()) {
            return 0;
        }

        BulkRequest.Builder br = new BulkRequest.Builder();
        orphans.forEach(id -> br.operations(op -> op.delete(d -> d.index(INDEX).id(String.valueOf(id)))));
        esClient.bulk(br.build());
        return orphans.size();
    }
}
