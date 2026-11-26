package com.gachi.gacha.server.news.domain;

import java.util.Objects;

/**
 * 수집 대상 계정 하나. 값은 IP 별 설정(news.topics.*.targets)에서 바로 묶인다.
 *
 * @param label     로그와 경고에 쓰는 이름 (예: KR_shop)
 * @param handle    X 계정 아이디
 * @param chunkDays 한 번 호출에 검색할 일수. Grok 의 X 검색은 한 번에 최대 10건만 가져오므로 게시물이 많은 계정은 작게 잡는다
 * @param webSearch 웹 검색 도구를 함께 쓸지
 * @param query     계정 검색어 뒤에 붙일 추가 검색어. 비우면 그 계정의 게시물을 전부 확인한다
 */
public record CollectTarget(
        String label,
        String handle,
        int chunkDays,
        boolean webSearch,
        String query
) {

    public CollectTarget {
        Objects.requireNonNull(label, "label");
        Objects.requireNonNull(handle, "handle");
        if (chunkDays < 1) {
            throw new IllegalArgumentException("chunkDays 는 1 이상이어야 한다: " + label);
        }
        query = query == null ? "" : query.strip();
    }

    /**
     * Grok 에 그대로 넘기는 X 검색어. 스크립트처럼 from:계정 뒤에 추가 검색어를 붙인다.
     */
    public String searchQuery() {
        return query.isEmpty() ? "from:" + handle : "from:" + handle + " " + query;
    }
}
