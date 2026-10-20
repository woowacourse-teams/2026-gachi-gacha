package com.gachi.gacha.server.gacha.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.gachi.gacha.server.gacha.application.dto.GachaDocument;
import com.gachi.gacha.server.gacha.application.dto.GachaSearchCondition;
import com.gachi.gacha.server.common.infra.elastic.dto.SearchResult;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class GachaSearchService {

    private final ElasticsearchClient esClient;

    @Value("${elasticsearch.index.gacha}")
    private String INDEX;

    public SearchResult<GachaDocument> search(final GachaSearchCondition condition) throws IOException {
        SearchResponse<GachaDocument> response = esClient.search(s -> s
                .index(INDEX)
                .from(condition.page() * condition.size())
                .size(condition.size() + 1)
                .query(buildQuery(condition))
                .sort(so -> so.score(ss -> ss.order(SortOrder.Desc)))
                .sort(so -> so.field(fs -> fs.field("id").order(SortOrder.Desc))), // tie-breaker
                GachaDocument.class);

        return toSearchResult(condition, response);
    }

    private Query buildQuery(final GachaSearchCondition condition) {
        return Query.of(q -> q.bool(b -> {
            applyKeyword(condition, b); // 1) 키워드: 점수 계산 대상
            applyCategoryFilter(condition, b); // 2) 카테고리 필터: 점수에 영향 없음 + 캐시됨
            applyGeoFilter(condition, b); // 3) 내 주변 가챠샵에 있는 가챠만
            return b;
        }));
    }

    private void applyKeyword(final GachaSearchCondition condition, final BoolQuery.Builder boolQueryBuilder) {
        if (!StringUtils.hasText(condition.keyword())) {
            boolQueryBuilder.must(m -> m.matchAll(ma -> ma));
            return;
        }
        boolQueryBuilder.should(s -> s.multiMatch(mm -> mm
                .query(condition.keyword())
                .fields("name^3", "categoryNames^2", "caption")
                .fuzziness("AUTO")));

        boolQueryBuilder.should(s -> s.multiMatch(mm -> mm
                .query(condition.keyword())
                .fields("categoryNames^2")
                .analyzer("korean")
                .boost(0.5f)));

        boolQueryBuilder.should(s -> s.match(m -> m
                .field("name.ngram")
                .query(condition.keyword())
                .operator(Operator.And)
                .boost(1.0f)));

        boolQueryBuilder.minimumShouldMatch("1");
    }

    private void applyCategoryFilter(final GachaSearchCondition condition, final BoolQuery.Builder boolQueryBuilder) {
        if (condition.categoryIds() == null || condition.categoryIds().isEmpty()) {
            return;
        }
        boolQueryBuilder.filter(f -> f.terms(t -> t
                .field("categoryIds")
                .terms(tf -> tf.value(condition.categoryIds().stream()
                        .map(FieldValue::of).toList()))));
    }

    private void applyGeoFilter(final GachaSearchCondition condition, final BoolQuery.Builder boolQueryBuilder) {
        if (condition.lat() == null || condition.lon() == null) {
            return;
        }
        double km = condition.distanceKm() != null ? condition.distanceKm() : 3.0;
        boolQueryBuilder.filter(f -> f.geoDistance(geo -> geo
                .field("locations")
                .distance(km + "km")
                .location(location -> location.latlon(ll -> ll.lat(condition.lat()).lon(condition.lon())))));
    }

    private SearchResult<GachaDocument> toSearchResult(
            final GachaSearchCondition condition,
            final SearchResponse<GachaDocument> response
    ) {
        List<GachaDocument> hits = response.hits().hits().stream()
                .map(Hit::source)
                .toList();

        boolean hasNext = hits.size() > condition.size();
        List<GachaDocument> content = hasNext ? hits.subList(0, condition.size()) : hits;

        return new SearchResult<>(content, condition.page(), condition.size(), hasNext);
    }
}
