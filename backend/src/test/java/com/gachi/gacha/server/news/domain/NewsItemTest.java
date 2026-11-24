package com.gachi.gacha.server.news.domain;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NewsItemTest {

    private static final String LINK = "https://x.com/chiikawashop_kr/status/2118131184446124112";
    private static final LocalDateTime PUBLISH_AT = LocalDateTime.of(2026, 11, 12, 8, 0);

    @Test
    @DisplayName("공개할 수 있는 후보는 공개 소식이 되고, 같은 소식인지 판단하는 값과 공개 시각을 함께 저장한다")
    void publishesPublishableCandidate() {
        NewsCandidate push = candidate(NewsSection.KOREA_STORE, true, null, LINK);
        NewsCandidate tabOnly = candidate(NewsSection.OVERSEAS, true, null, LINK);

        NewsItem item = NewsItem.publish("CHIIKAWA", push, PUBLISH_AT);

        assertThat(item.getTopic()).isEqualTo("CHIIKAWA");
        assertThat(item.getCandidate()).isSameAs(push);
        assertThat(item.getLinkKey()).isEqualTo("x:2118131184446124112");
        assertThat(item.getPublishedAt()).isEqualTo(PUBLISH_AT);
        assertThat(NewsItem.publish("CHIIKAWA", tabOnly, PUBLISH_AT).getCandidate()).isSameAs(tabOnly);
    }

    @Test
    @DisplayName("발송이 미뤄지면 공개 시각도 같이 미룬다")
    void reschedulesPublishTime() {
        NewsItem item = NewsItem.publish("CHIIKAWA", candidate(NewsSection.KOREA_STORE, true, null, LINK), PUBLISH_AT);

        item.reschedule(PUBLISH_AT.plusDays(1));

        assertThat(item.getPublishedAt()).isEqualTo(PUBLISH_AT.plusDays(1));
    }

    @Test
    @DisplayName("링크를 확인하지 못했거나 끝난 후보는 공개할 수 없다")
    void rejectsUnpublishableCandidates() {
        NewsCandidate needsCheck = candidate(NewsSection.KOREA_STORE, null, null, LINK);
        NewsCandidate ended = candidate(NewsSection.KOREA_STORE, true, LocalDate.of(2026, 11, 3), LINK);

        assertThatThrownBy(() -> NewsItem.publish("CHIIKAWA", needsCheck, PUBLISH_AT))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> NewsItem.publish("CHIIKAWA", ended, PUBLISH_AT))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private NewsCandidate candidate(
            final NewsSection section,
            final Boolean linkVerified,
            final LocalDate endDate,
            final String link
    ) {
        NewsTiming timing = NewsTiming.judge(null, endDate, "제목", null, LocalDate.of(2026, 11, 12));
        return NewsCandidate.collected(1L, news(section, NewsKind.RELEASE, "제목", null, endDate, link, linkVerified, timing));
    }
}
