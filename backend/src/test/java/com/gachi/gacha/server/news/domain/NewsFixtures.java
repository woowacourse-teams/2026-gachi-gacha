package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * 신상 소식 테스트에서 함께 쓰는 소식 만들기.
 */
public final class NewsFixtures {

    public static final CollectTarget KR_SHOP = new CollectTarget("KR_shop", "chiikawashop_kr", 2, true, "");
    public static final CollectTarget JP_KOUHOU = new CollectTarget(
            "JP_kouhou", "chiikawa_kouhou", 7, false, "-filter:replies -filter:retweets");

    private NewsFixtures() {
    }

    public static CollectedNews news(
            final NewsSection section,
            final NewsKind kind,
            final String title,
            @Nullable final LocalDate startDate,
            @Nullable final LocalDate endDate,
            @Nullable final String link,
            @Nullable final Boolean linkVerified,
            @Nullable final NewsTiming timing
    ) {
        return new CollectedNews(section, kind, title, startDate, endDate, link, linkVerified, timing, detail());
    }

    /**
     * 링크가 검증된 한국 매장 발매 소식. 진행 상태는 아직 판단하지 않은 상태다.
     */
    public static CollectedNews koreaStore(final String title, @Nullable final String link) {
        return news(NewsSection.KOREA_STORE, NewsKind.RELEASE, title, null, null, link, true, null);
    }

    public static NewsDetail detail(final List<String> notes, @Nullable final String refUrl) {
        return detail().withNotesAndRefUrl(notes, refUrl);
    }

    public static NewsDetail detail() {
        return new NewsDetail("11/12(목)", "치이카와샵 용산점", List.of(new NewsDetail.Product("앉은 인형", null, null)),
                null, List.of(), null, "chiikawashop_kr");
    }
}
