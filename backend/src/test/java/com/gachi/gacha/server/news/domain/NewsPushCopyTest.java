package com.gachi.gacha.server.news.domain;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class NewsPushCopyTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 3);
    private long sequence;

    @Test
    @DisplayName("시작일과 종료일을 알면 기간으로 보여준다")
    void range() {
        NewsCandidate item = candidate(NewsKind.ENTRY_RESERVATION, "치이카와샵 용산점 네이버 예약 입장 안내",
                LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 8));

        assertThat(NewsPushCopy.body(List.of(item), TODAY)).isEqualTo("[입장예약 11/5(목)~11/8(일)] 치이카와샵 용산점 네이버 예약 입장 안내");
    }

    @Test
    @DisplayName("시작일만 알면 '시작일~', 소식이 더 있으면 '외 N건'을 붙인다")
    void startOnlyAndMore() {
        NewsCandidate lead = candidate(NewsKind.RESTOCK, "영화 치이카와 인기 상품 재입고", LocalDate.of(2026, 11, 5), null);
        NewsCandidate other = candidate(NewsKind.RELEASE, "다른 소식", LocalDate.of(2026, 11, 20), null);

        assertThat(NewsPushCopy.body(List.of(other, lead), TODAY)).isEqualTo("[재입고 11/5(목)~] 영화 치이카와 인기 상품 재입고 외 1건");
    }

    @Test
    @DisplayName("이미 시작한 소식은 시작일 대신 '진행 중'으로, 끝나는 날을 알면 '진행 중 ~끝나는 날'로 보여준다")
    void ongoing() {
        NewsCandidate withEnd = candidate(NewsKind.RELEASE, "연하엽서 3매 세트", LocalDate.of(2026, 10, 20), LocalDate.of(2026, 11, 30));
        NewsCandidate noEnd = candidate(NewsKind.RELEASE, "계속 판매", LocalDate.of(2026, 10, 25), null);
        NewsCandidate a = candidate(NewsKind.RELEASE, "A", LocalDate.of(2026, 11, 10), null);
        NewsCandidate b = candidate(NewsKind.RELEASE, "B", LocalDate.of(2026, 11, 12), null);

        assertThat(NewsPushCopy.body(List.of(withEnd, a, b), TODAY)).isEqualTo("[발매 진행 중 ~11/30] 연하엽서 3매 세트 외 2건");
        assertThat(NewsPushCopy.body(List.of(noEnd), TODAY)).isEqualTo("[발매 진행 중] 계속 판매");
    }

    @Test
    @DisplayName("날짜를 모르면 종류만 쓰고, 종료일만 알면 이미 시작한 것으로 보아 '진행 중 ~종료일'이다")
    void unknownDates() {
        NewsCandidate unknown = candidate(NewsKind.RELEASE, "신상품 발매", null, null);
        NewsCandidate endOnly = candidate(NewsKind.LOTTERY, "쿠지", null, LocalDate.of(2026, 11, 20));

        assertThat(NewsPushCopy.body(List.of(unknown), TODAY)).isEqualTo("[발매] 신상품 발매");
        assertThat(NewsPushCopy.body(List.of(endOnly), TODAY)).isEqualTo("[쿠지 진행 중 ~11/20] 쿠지");
    }

    @Test
    @DisplayName("하루짜리 행사는 날짜 하나만 보여준다")
    void singleDay() {
        NewsCandidate item = candidate(NewsKind.POPUP, "팝업", LocalDate.of(2026, 11, 7), LocalDate.of(2026, 11, 7));

        assertThat(NewsPushCopy.body(List.of(item), TODAY)).isEqualTo("[팝업 11/7(토)] 팝업");
    }

    @Test
    @DisplayName("행사가 가장 빨리 시작하는 소식을 앞에 두고, 날짜를 모르는 소식은 뒤로 보낸다")
    void earliestStartFirst() {
        NewsCandidate unknown = candidate(NewsKind.RELEASE, "날짜 모름", null, null);
        NewsCandidate later = candidate(NewsKind.RELEASE, "나중", LocalDate.of(2026, 11, 20), null);
        NewsCandidate earlier = candidate(NewsKind.RELEASE, "먼저", LocalDate.of(2026, 11, 6), null);

        assertThat(NewsPushCopy.body(List.of(unknown, later, earlier), TODAY)).startsWith("[발매 11/6(금)~] 먼저 외 2건");
    }

    @Test
    @DisplayName("제목이 길면 줄이고, 담을 소식이 없으면 만들 수 없다")
    void longTitleAndEmpty() {
        NewsCandidate item = candidate(NewsKind.RELEASE, "아주 긴 제목 ".repeat(20), null, null);

        assertThat(NewsPushCopy.body(List.of(item), TODAY)).hasSizeLessThanOrEqualTo("[발매] ".length() + 60).endsWith("…");
        assertThatThrownBy(() -> NewsPushCopy.body(List.of(), TODAY)).isInstanceOf(IllegalArgumentException.class);
    }

    private NewsCandidate candidate(final NewsKind kind, final String title, @Nullable final LocalDate start, @Nullable final LocalDate end) {
        sequence++;
        NewsCandidate candidate = NewsCandidate.collected(1L, news(NewsSection.KOREA_STORE, kind, title, start, end,
                "https://x.com/a/status/" + sequence, true, null));
        ReflectionTestUtils.setField(candidate, "id", sequence);
        return candidate;
    }
}
