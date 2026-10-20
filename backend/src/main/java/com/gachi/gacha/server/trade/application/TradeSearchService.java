package com.gachi.gacha.server.trade.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
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

    public SearchResult<TradeDocument> search(final TradeSearchCondition condition) throws IOException {
        SearchResponse<TradeDocument> response = esClient.search(s -> s
                .index(INDEX)
                .from(condition.page() * condition.size())
                .size(condition.size() + 1)
                .query(buildQuery(condition))
                .sort(so -> so.score(sc -> sc.order(SortOrder.Desc)))
                .sort(so -> so.field(f -> f.field("tradeId").order(SortOrder.Desc))),
                TradeDocument.class);

        return toSearchResult(condition, response);
    }

    private Query buildQuery(final TradeSearchCondition condition) {
        return Query.of(q -> q.bool(b -> {
            applyKeyword(condition, b);
            applyCategoryFilter(condition, b);
            return b;
        }));
    }

    private void applyKeyword(final TradeSearchCondition condition, final BoolQuery.Builder boolQueryBuilder) {
        if (!StringUtils.hasText(condition.keyword())) {
            boolQueryBuilder.must(m -> m.matchAll(ma -> ma));
            return;
        }
        boolQueryBuilder.should(s -> s.multiMatch(mm -> mm
                .query(condition.keyword())
                .fields("title^3", "title.ngram^2", "categories")
                .fuzziness("AUTO")));
        boolQueryBuilder.should(s -> s.match(m -> m
                .query(condition.keyword())
                .field("categories^2")
                .analyzer("korean")
                .boost(0.5f)));
        boolQueryBuilder.should(s -> s.match(m -> m
                .field("title.ngram")
                .query(condition.keyword())
                .operator(Operator.And)
                .boost(1.0f)));
        boolQueryBuilder.minimumShouldMatch("1");
    }

    private void applyCategoryFilter(final TradeSearchCondition condition, final BoolQuery.Builder boolQueryBuilder) {
        if (condition.categoryIds() == null || condition.categoryIds().isEmpty()) {
            return;
        }
        boolQueryBuilder.filter(f -> f.terms(t -> t
                .field("categoryIds")
                .terms(tf -> tf.value(condition.categoryIds().stream()
                        .map(FieldValue::of).toList()))));
    }

    private SearchResult<TradeDocument> toSearchResult(
            final TradeSearchCondition condition,
            final SearchResponse<TradeDocument> response
    ) {
        List<TradeDocument> hits = response.hits().hits().stream()
                .map(Hit::source)
                .toList();

        boolean hasNext = hits.size() > condition.size();
        List<TradeDocument> content = hasNext ? hits.subList(0, condition.size()) : hits;

        return new SearchResult<>(content, condition.page(), content.size(), hasNext);
    }
}
