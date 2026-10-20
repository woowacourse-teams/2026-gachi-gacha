package com.gachi.gacha.server.trade.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.trade.application.dto.TradeDocument;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeImage;
import com.gachi.gacha.server.trade.domain.TradeImageJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.exception.TradeIndexingException;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TradeIndexService {

    private static final int BATCH_SIZE = 500;

    private final ElasticsearchClient esClient;
    private final TradeJpaRepository tradeJpaRepository;
    private final TradeImageJpaRepository tradeImageJpaRepository;

    @Value("${elasticsearch.index.trade}")
    private String INDEX;

    public void indexAll(List<Long> tradeIds) throws IOException {
        if (tradeIds.isEmpty()) {
            return;
        }
        List<Trade> trades = tradeJpaRepository.findByIdsWithCategories(tradeIds);
        Map<Long, String> thumbnails = findThumbnails(tradeIds);

        BulkRequest.Builder br = new BulkRequest.Builder();
        Set<Long> found = new HashSet<>();

        for (Trade trade : trades) {
            found.add(trade.getId());
            TradeDocument doc = TradeDocument.of(trade, thumbnails.get(trade.getId()));
            br.operations(op -> op.index(i -> i.index(INDEX).id(String.valueOf(trade.getId())).document(doc)));
        }
        for (Long id : tradeIds) {
            if (!found.contains(id)) {
                br.operations(op -> op.delete(d -> d.index(INDEX).id(String.valueOf(id))));
            }
        }
        BulkResponse res = esClient.bulk(br.build());
        if (res.errors()) {
            List<String> failed = res.items().stream()
                    .filter(i -> i.error() != null)
                    .map(i -> i.id() + ":" + i.error().reason())
                    .toList();
            throw new TradeIndexingException(ErrorCode.ELASTICSEARCH_INDEX_FAILED,
                    "ES bulk 색인 실패 count=" + failed.size() + " " + abbreviate(failed));
        }
    }

    public void reindexAll() throws IOException {
        int page = 0;
        Slice<Long> ids;
        do {
            ids = tradeJpaRepository.findTradeIds(PageRequest.of(page++, BATCH_SIZE, Sort.by("id")));
            indexAll(ids.getContent());
        } while (ids.hasNext());
    }

    private Map<Long, String> findThumbnails(final List<Long> tradeIds) {
        return tradeImageJpaRepository.findFirstImagesByTradeIdIn(tradeIds).stream()
                .collect(Collectors.toMap(
                        image -> image.getTrade().getId(),
                        TradeImage::getImageUrl
                ));
    }

    private String abbreviate(final List<String> failed) {
        return failed.stream().limit(5).collect(Collectors.joining(", "))
                + (failed.size() > 5 ? " ..." : "");
    }
}
