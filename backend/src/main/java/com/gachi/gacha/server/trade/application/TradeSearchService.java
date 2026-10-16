package com.gachi.gacha.server.trade.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery.Builder;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.gachi.gacha.server.common.infra.elastic.dto.SearchResult;
import com.gachi.gacha.server.trade.application.dto.TradeDocument;
import com.gachi.gacha.server.trade.application.dto.TradeSearchCondition;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class TradeSearchService {

    @Value("${elasticsearch.index.trade}")
    private String INDEX;

    private final ElasticsearchClient esClient;

    public SearchResult<TradeDocument> search(final TradeSearchCondition c) throws IOException {
        SearchResponse<TradeDocument> res = esClient.search(s -> s
                .index(INDEX)
                .from(c.page() * c.size())
                .size(c.size() + 1)
                .query(buildQuery(c))
                .sort(so -> so.score(sc -> sc.order(SortOrder.Desc)))
                .sort(so -> so.field(f -> f.field("tradeId").order(SortOrder.Desc))),
                TradeDocument.class);

        return toSearchResult(c, res);
    }

    private Query buildQuery(final TradeSearchCondition c) {
        return Query.of(q -> q.bool(b -> {
            applyKeyword(c, b);
            applyCategoryFilter(c, b);
            return b;
        }));
    }

    private void applyKeyword(final TradeSearchCondition c, final Builder b) {
        if (!StringUtils.hasText(c.keyword())) {
            b.must(m -> m.matchAll(ma -> ma));
            return;
        }
        b.should(m -> m.multiMatch(mm -> mm
                .query(c.keyword())
                .fields("title^3", "title.ngram^2", "categories", "status")
                .fuzziness("AUTO")));
        b.should(m -> m.multiMatch(mm -> mm
                .query(c.keyword())
                .fields("categories^2", "status")
                .analyzer("korean")
                .boost(0.5f)));
        b.should(m -> m.match(mt -> mt
                .field("title.ngram")
                .query(c.keyword())
                .operator(Operator.And)
                .boost(1.0f)));
        b.minimumShouldMatch("1");
    }

    private void applyCategoryFilter(final TradeSearchCondition c, final Builder b) {
        if (c.categoryIds() == null || c.categoryIds().isEmpty()) {
            return;
        }
        b.filter(f -> f.terms(t -> t
                .field("categoryIds")
                .terms(tv -> tv.value(c.categoryIds().stream()
                        .map(FieldValue::of).toList()))));
    }

    private SearchResult<TradeDocument> toSearchResult(
            final TradeSearchCondition c,
            final SearchResponse<TradeDocument> res
    ) {
        List<TradeDocument> hits = res.hits().hits().stream()
                .map(Hit::source)
                .toList();

        boolean hasNext = hits.size() > c.size();
        List<TradeDocument> content = hasNext ? hits.subList(0, c.size()) : hits;

        return new SearchResult<>(content, c.page(), c.size(), hasNext);
    }
}
