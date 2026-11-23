package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import org.jspecify.annotations.Nullable;

/**
 * Grok 호출 하나. 계정 하나를 한 기간만 검색한다.
 *
 * @param from 검색 시작일 (UTC, 포함)
 * @param to   검색 종료일 (UTC, 포함하지 않음). null 이면 지금까지
 */
public record CollectCall(CollectTarget target, LocalDate from, @Nullable LocalDate to) {

    /**
     * 로그·경고에 쓰는 호출 이름. 스크립트처럼 "라벨_시작일" 형식이다.
     */
    public String label() {
        return target.label() + "_" + from;
    }

    /**
     * 프롬프트의 "검색 기간" 끝 표기. 스크립트와 같은 문구다.
     */
    public String toLabel() {
        return to == null ? "오늘" : to + " 직전";
    }
}
