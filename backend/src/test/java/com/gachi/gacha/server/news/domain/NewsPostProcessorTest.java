package com.gachi.gacha.server.news.domain;

import static com.gachi.gacha.server.news.domain.NewsFixtures.detail;
import static com.gachi.gacha.server.news.domain.NewsFixtures.koreaStore;
import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class NewsPostProcessorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 9);
    private static final String STORE_HOURS = "10:30 ~ 22:00";

    private final NewsPostProcessor processor = new NewsPostProcessor();

    @Nested
    @DisplayName("중복 제거")
    class Deduplication {

        @Test
        @DisplayName("같은 X 게시물은 표기가 달라도 먼저 나온 것만 남긴다")
        void keepsFirstOfSamePost() {
            NewsPostProcessor.Result result = process(List.of(
                    koreaStore("첫 번째", "https://x.com/chiikawa_market/status/2118523764224782564"),
                    koreaStore("두 번째", "https://x.com/i/status/2118523764224782564"),
                    koreaStore("세 번째", "https://twitter.com/chiikawa_market/status/2118523764224782564?s=20")));

            assertThat(result.items()).extracting(CollectedNews::title).containsExactly("첫 번째");
            assertThat(result.duplicateCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("링크가 없거나 http 로 시작하지 않으면 중복으로 보지 않는다 (대문자 스킴도 스크립트처럼)")
        void keepsItemsWithoutHttpLink() {
            NewsPostProcessor.Result result = process(List.of(
                    koreaStore("링크 없음 1", null), koreaStore("링크 없음 2", null),
                    koreaStore("대문자 1", "HTTPS://x.com/a/status/1"), koreaStore("대문자 2", "HTTPS://x.com/a/status/1")));

            assertThat(result.items()).hasSize(4);
            assertThat(result.duplicateCount()).isZero();
        }

        @Test
        @DisplayName("웹 페이지 링크는 쿼리와 끝 슬래시를 무시하고 비교한다")
        void comparesWebPagesNormalized() {
            NewsPostProcessor.Result result = process(List.of(
                    koreaStore("페이지 1", "https://chiikawa-info.jp/ck_land.html"),
                    koreaStore("페이지 2", "https://Chiikawa-Info.jp/ck_land.html/?ref=x")));

            assertThat(result.items()).extracting(CollectedNews::title).containsExactly("페이지 1");
        }
    }

    @Nested
    @DisplayName("진행 상태")
    class Timing {

        @Test
        @DisplayName("끝난 소식은 따로 모으고, 나머지에는 진행 상태를 채운다")
        void separatesEndedItems() {
            CollectedNews upcoming = news(NewsSection.KOREA_STORE, NewsKind.RELEASE, "예정", LocalDate.of(2026, 11, 12), null,
                    "https://x.com/a/status/1", true, null);
            CollectedNews ended = news(NewsSection.KOREA_STORE, NewsKind.RELEASE, "종료", null, LocalDate.of(2026, 11, 8),
                    "https://x.com/a/status/2", true, null);
            CollectedNews unknown = koreaStore("모름", "https://x.com/a/status/3");

            NewsPostProcessor.Result result = process(List.of(upcoming, ended, unknown));

            assertThat(result.items()).extracting(CollectedNews::title, CollectedNews::timing)
                    .containsExactly(tuple("예정", NewsTiming.UPCOMING), tuple("모름", null));
            assertThat(result.endedItems()).extracting(CollectedNews::title).containsExactly("종료");
            assertThat(result.all()).hasSize(3);
        }
    }

    @Nested
    @DisplayName("notes 와 ref_url 정리")
    class Cleanup {

        @Test
        @DisplayName("평소 운영시간과 같은 공지는 지우고, 운영시간이 바뀌는 공지는 남긴다")
        void filtersRegularStoreHours() {
            CollectedNews news = koreaStore("입고", "https://x.com/a/status/1").with(detail(List.of(
                    "운영시간: 10:30~22:00",
                    "운영시간 10:30 ~ 22:00 → 20:00 단축",
                    "11/12 임시 휴무 (평소 10:30 ~ 22:00)",
                    "출고 중단 안내"), null), null);

            assertThat(process(List.of(news)).items().getFirst().detail().notes()).containsExactly(
                    "운영시간 10:30 ~ 22:00 → 20:00 단축",
                    "11/12 임시 휴무 (평소 10:30 ~ 22:00)",
                    "출고 중단 안내");
        }

        @Test
        @DisplayName("매장 운영시간 설정이 없으면 notes 를 지우지 않는다")
        void keepsNotesWithoutStoreHours() {
            CollectedNews news = koreaStore("입고", "https://x.com/a/status/1")
                    .with(detail(List.of("운영시간: 10:30 ~ 22:00"), null), null);

            assertThat(processor.process(List.of(news), TODAY, null).items().getFirst().detail().notes())
                    .containsExactly("운영시간: 10:30 ~ 22:00");
        }

        @ParameterizedTest
        @CsvSource({
                "https://a.com/p?utm_source=x&utm_medium=sns&id=3, https://a.com/p?id=3",
                "https://a.com/p?id=3&utm_campaign=w, https://a.com/p?id=3",
                "https://a.com/p?utm_source=x, https://a.com/p",
                "https://a.com/p?id=3, https://a.com/p?id=3"
        })
        @DisplayName("ref_url 의 utm 추적 파라미터를 지운다")
        void removesUtmParameters(final String refUrl, final String expected) {
            CollectedNews news = koreaStore("입고", "https://x.com/a/status/1").with(detail(List.of(), refUrl), null);

            assertThat(process(List.of(news)).items().getFirst().detail().refUrl()).isEqualTo(expected);
        }

        @Test
        @DisplayName("ref_url 이 비었으면 null 로 둔다")
        void nullRefUrlWhenEmpty() {
            CollectedNews news = koreaStore("입고", "https://x.com/a/status/1").with(detail(List.of(), ""), null);

            assertThat(process(List.of(news)).items().getFirst().detail().refUrl()).isNull();
        }
    }

    private NewsPostProcessor.Result process(final List<CollectedNews> items) {
        return processor.process(items, TODAY, STORE_HOURS);
    }
}
