package com.gachi.gacha.server.trade.domain;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * 목록 조회의 선택적 필터(keyword / categoryIds / status)를 조립한다.
 * <p>
 * 이 레포의 다른 리포지토리들은 모두 {@code @Query}를 쓰는데 여기만 Criteria 를 쓰는 이유는, 필터가 전부
 * 선택값이라 {@code @Query}로 쓰면 같은 WHERE 절이 네 번 복사되기 때문이다. 필터가 세 개면 조합이 여덟 가지인데,
 * {@code keyword}와 {@code status}는 {@code (:param IS NULL OR ...)} 널 가드로 흡수할 수 있지만
 * {@code categoryIds}는 {@code IN}에 빈 컬렉션을 넘길 수 없어 메서드를 따로 둬야 하고(×2),
 * 페이징 때문에 {@code countQuery}까지 붙으면 다시 ×2가 되어 총 네 벌의 동일한 WHERE 절이 생긴다.
 * <p>
 * 반대로 여기서는 "조건이 있을 때만 술어를 덧붙이는" 방식이라 중복이 없고, 널 가드도 필요 없다.
 * 필터가 더 늘어나도 {@code if} 블록 하나씩만 추가된다.
 * <p>
 * 나중에 가챠 등 다른 도메인에도 동적 검색이 생기면 QueryDSL 도입을 검토할 만하다.
 */
public final class TradeSpecifications {

    private TradeSpecifications() {
    }

    /**
     * @param keyword     제목·내용 검색어. 호출 전에 공백을 정리해 넘기고, 값이 없으면 {@code null}이다.
     * @param categoryIds 이 중 하나라도 걸린 게시글을 찾는다(AND 가 아니라 OR). 비어 있으면 조건에서 제외된다.
     * @param status      교환 상태. {@code null}이면 조건에서 제외된다.
     */
    public static Specification<Trade> search(
            final String keyword,
            final List<Long> categoryIds,
            final TradeStatus status
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%%%s%%".formatted(keyword);
                predicates.add(builder.or(
                        builder.like(root.get("title"), pattern),
                        builder.like(root.get("description"), pattern)
                ));
            }

            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }

            if (categoryIds != null && !categoryIds.isEmpty()) {
                predicates.add(builder.exists(categoryIdIn(root, query, builder, categoryIds)));
            }

            // 술어가 하나도 없으면 builder.and()는 항상 참인 조건이 되어, 필터 없는 전체 조회가 된다.
            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * 카테고리 필터를 조인이 아닌 EXISTS 서브쿼리로 만든다.
     * <p>
     * {@code trade_category}를 조인하면 카테고리를 여러 개 가진 게시글이 카테고리 수만큼 중복 행으로 나오고,
     * 그 상태로 count 를 세면 페이지의 {@code totalElements}가 실제 게시글 수보다 부풀어 오른다.
     * {@code DISTINCT}로 걷어낼 수도 있지만, "조건에 맞는 매핑이 하나라도 있는가"라는 원래 의도를
     * 그대로 옮기는 EXISTS 쪽이 의도가 분명하다.
     */
    private static Subquery<Long> categoryIdIn(
            final Root<Trade> root,
            final CriteriaQuery<?> query,
            final CriteriaBuilder builder,
            final List<Long> categoryIds
    ) {
        Subquery<Long> subquery = query.subquery(Long.class);
        Root<TradeCategory> tradeCategory = subquery.from(TradeCategory.class);

        return subquery.select(tradeCategory.get("id"))
                .where(builder.and(
                        builder.equal(tradeCategory.get("trade").get("id"), root.get("id")),
                        tradeCategory.get("category").get("id").in(categoryIds)
                ));
    }
}
