package com.gachi.gacha.server.news.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * 화면과 메시지에 보여주기만 하는 소식 내용. 조건으로 검색하지 않아서 한 JSONB 컬럼(news_candidate.detail)에 담는다.
 *
 * @param dateLabel     사람이 읽는 날짜 표기 (예: 11/5(목) 11시 발매)
 * @param location      매장·판매처·행사 장소
 * @param importance    모델이 정한 중요도 (high, medium, low). 슬랙에서 정렬과 표시에 쓴다
 * @param refUrl        게시물 안의 예약·상품 페이지 링크
 * @param sourceAccount 소식을 수집한 X 계정
 */
public record NewsDetail(
        @Nullable String dateLabel,
        @Nullable String location,
        List<Product> products,
        @Nullable Reservation reservation,
        List<String> notes,
        @Nullable String importance,
        @Nullable String refUrl,
        @Nullable String sourceAccount
) {

    public NewsDetail {
        products = products == null ? List.of() : List.copyOf(products);
        notes = notes == null ? List.of() : List.copyOf(notes);
    }

    /**
     * @param nameJa 일본어 원문. 원문이 한국어면 null
     */
    public record Product(@Nullable String name, @Nullable String nameJa, @Nullable String price) {
    }

    /**
     * @param openAt 예약 오픈 시각
     * @param note   입장 방식 등
     */
    public record Reservation(
            @Nullable String method,
            @Nullable String period,
            @Nullable String openAt,
            @Nullable String note
    ) {
    }
}
