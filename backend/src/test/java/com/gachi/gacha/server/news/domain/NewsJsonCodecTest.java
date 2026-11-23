package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NewsJsonCodecTest {

    @Test
    @DisplayName("수집 기간은 계정을 키로, 날짜는 YYYY-MM-DD 문자열로 저장하고 순서대로 읽는다")
    void writesAndReadsPeriods() {
        List<CollectPeriod> periods = List.of(
                new CollectPeriod("chiikawashop_kr", LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 12), true),
                new CollectPeriod("chiikawa_market", LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 12), false));

        String json = NewsJsonCodec.writePeriods(periods);

        assertThat(json).isEqualTo(
                "{\"chiikawashop_kr\":{\"from\":\"2026-11-09\",\"to\":\"2026-11-12\",\"collected\":true},"
                        + "\"chiikawa_market\":{\"from\":\"2026-11-05\",\"to\":\"2026-11-12\",\"collected\":false}}");
        assertThat(NewsJsonCodec.readPeriods(json)).isEqualTo(periods);
    }

    @Test
    @DisplayName("수집 여부가 없는 기간은 수집하지 않은 것으로 읽는다")
    void readsMissingCollectedAsFalse() {
        assertThat(NewsJsonCodec.readPeriods("{\"chiikawa_m_kr\":{\"from\":\"2026-11-09\",\"to\":\"2026-11-12\"}}"))
                .containsExactly(CollectPeriod.notCollected("chiikawa_m_kr", LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 12)));
    }

    @Test
    @DisplayName("소식 내용을 그대로 저장하고 읽으며, 없는 목록은 빈 목록으로 읽는다")
    void writesAndReadsDetail() {
        NewsDetail detail = new NewsDetail(
                "11/5(목) ~ 11/8(일)", "치이카와샵 용산점",
                List.of(new NewsDetail.Product("앉은 인형", "おすわりぬいぐるみ", null)),
                new NewsDetail.Reservation("네이버 예약", "11/5~11/8", null, "예약자 우선 입장"),
                List.of("11/12 운영시간 단축"), "high", "https://booking.naver.com/a", "chiikawashop_kr");

        assertThat(NewsJsonCodec.readDetail(NewsJsonCodec.writeDetail(detail))).isEqualTo(detail);
        NewsDetail partial = NewsJsonCodec.readDetail("{\"location\": \"치이카와 마켓\"}");
        assertThat(partial.location()).isEqualTo("치이카와 마켓");
        assertThat(partial.products()).isEmpty();
        assertThat(partial.notes()).isEmpty();
    }

    @Test
    @DisplayName("사용량을 저장하고 읽으며, 빈 값 {} 는 사용량 없음으로 읽는다")
    void writesAndReadsUsage() {
        GrokUsage usage = new GrokUsage(12, 2, 30, 0, 90000, 9000, 200_000_000);

        assertThat(NewsJsonCodec.readUsage(NewsJsonCodec.writeUsage(usage))).isEqualTo(usage);
        assertThat(NewsJsonCodec.readUsage("{}")).isEqualTo(GrokUsage.NONE);
    }
}
