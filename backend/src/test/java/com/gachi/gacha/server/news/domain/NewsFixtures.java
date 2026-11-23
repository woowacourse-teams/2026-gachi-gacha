package com.gachi.gacha.server.news.domain;

import com.gachi.gacha.server.news.infra.NewsProperties;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
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

    /**
     * 치이카와 주제 하나가 있는 설정. 목요일에 한국 매장·일본 홍보 계정을 수집한다.
     */
    public static NewsProperties properties(
            final boolean dryRun,
            final String environmentLabel,
            final int maxCallsPerRun,
            final double maxCostUsd
    ) {
        NewsProperties.Topic chiikawa = new NewsProperties.Topic("치이카와", "ちいかわ", "news/prompts/chiikawa",
                "chiikawa-v2", "10:30 ~ 22:00", List.of(KR_SHOP, JP_KOUHOU),
                Map.of("THURSDAY", List.of("KR_shop", "JP_kouhou")));
        return new NewsProperties(false, dryRun, environmentLabel, ZoneId.of("Asia/Seoul"), 30,
                new NewsProperties.Collect(7, 14, maxCallsPerRun, maxCostUsd, Duration.ofHours(6)),
                new NewsProperties.Xai("https://api.x.ai/v1", "key", "grok-4.3", Duration.ofSeconds(10),
                        Duration.ofSeconds(300), 2, 3),
                new NewsProperties.Slack(null, "C0NEWS"),
                Map.of("CHIIKAWA", chiikawa));
    }

    public static NewsDetail detail(final List<String> notes, @Nullable final String refUrl) {
        return detail().withNotesAndRefUrl(notes, refUrl);
    }

    public static NewsDetail detail() {
        return new NewsDetail("11/12(목)", "치이카와샵 용산점", List.of(new NewsDetail.Product("앉은 인형", null, null)),
                null, List.of(), null, "chiikawashop_kr");
    }
}
