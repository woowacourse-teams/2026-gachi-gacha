package com.gachi.gacha.server.news.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.jspecify.annotations.Nullable;

/**
 * Grok 응답에서 읽고 형식 검사를 통과한 소식 하나.
 *
 * @param link         근거 게시물 URL. 없으면 null
 * @param linkVerified 링크가 응답의 출처 목록에 있는지. null 은 판단 보류(출처 목록이 비었거나 링크가 없음)
 * @param timing       수집일(KST) 기준 진행 상태. 후처리에서 채우고, 판단할 수 없으면 null
 */
public record CollectedNews(
        NewsSection section,
        NewsKind kind,
        String title,
        @Nullable LocalDate startDate,
        @Nullable LocalDate endDate,
        @Nullable String link,
        @Nullable Boolean linkVerified,
        @Nullable NewsTiming timing,
        NewsDetail detail
) {

    public NewsReview review() {
        return NewsReview.classify(section, timing, linkVerified, link);
    }

    /**
     * 같은 소식인지 판단하는 값. X 게시물은 게시물 번호다.
     */
    public String linkKey() {
        return NewsLink.normalize(link);
    }

    public Optional<Instant> postedAt() {
        return NewsLink.postedAt(link);
    }

    public CollectedNews with(final NewsDetail newDetail, @Nullable final NewsTiming newTiming) {
        return new CollectedNews(section, kind, title, startDate, endDate, link, linkVerified, newTiming, newDetail);
    }
}
