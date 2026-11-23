package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.news.domain.CollectedNews;
import com.gachi.gacha.server.news.domain.NewsDetail;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsSection;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

class GrokResponseParserTest {

    private static final String LABEL = "KR_shop_2026-11-02";
    private static final String ACCOUNT = "chiikawashop_kr";
    private static final String POST = "https://x.com/chiikawashop_kr/status/2119700000000000000";

    private final ObjectMapper objectMapper = JsonMapper.builder().build();
    private final GrokResponseParser parser = new GrokResponseParser(objectMapper);

    @Nested
    @DisplayName("호출 실패로 보는 응답")
    class Failures {

        @ParameterizedTest
        @ValueSource(strings = {"<html>502 Bad Gateway</html>", "", "   "})
        @DisplayName("응답 본문이 JSON 이 아니면 실패다")
        void failsWhenNotJson(final String body) {
            assertThat(parser.parse(LABEL, ACCOUNT, body)).isInstanceOf(GrokResponseParser.Result.Failure.class);
        }

        @Test
        @DisplayName("error 가 오면 실패이고 내용을 300자까지 남긴다. null 이나 false 면 실패가 아니다")
        void errorField() {
            GrokResponseParser.Result result = parser.parse(LABEL, ACCOUNT,
                    objectMapper.createObjectNode().put("error", "x".repeat(400)).toString());
            ObjectNode nullError = response(itemsJson(POST), List.of(), 1);
            nullError.putNull("error");
            ObjectNode falseError = response(itemsJson(POST), List.of(), 1);
            falseError.put("error", false);

            assertThat(((GrokResponseParser.Result.Failure) result).reason())
                    .isEqualTo("[" + LABEL + "] 에러: " + "x".repeat(300));
            assertThat(((GrokResponseParser.Result.Failure) result).usage().calls()).isEqualTo(1);
            assertThat(parser.parse(LABEL, ACCOUNT, nullError.toString())).isInstanceOf(GrokResponseParser.Result.Success.class);
            assertThat(parser.parse(LABEL, ACCOUNT, falseError.toString())).isInstanceOf(GrokResponseParser.Result.Success.class);
        }
    }

    @Nested
    @DisplayName("본문 해석")
    class Content {

        @Test
        @DisplayName("코드 블록을 벗겨내고 응답 필드를 모두 읽으며, 출처 계정은 모델이 아니라 호출한 계정으로 정한다")
        void readsAllFields() {
            String text = "```json\n" + """
                    {"items": [{
                      "section": "korea_store", "kind": "entry_reservation", "title": "네이버 예약 입장 안내",
                      "start_date": "2026-11-05", "end_date": "2026-11-08", "date_label": "11/5 ~ 11/8",
                      "location": "치이카와샵 용산점",
                      "products": [{"name": "앉은 인형", "name_ja": "おすわりぬいぐるみ", "price": "29,000원"}],
                      "reservation": {"method": "네이버 예약", "period": "11/5~11/8", "open_at": "11/4 12:00", "note": null},
                      "notes": ["출고 중단"],
                      "link": "%s", "ref_url": "https://booking.naver.com/a", "source_account": "모델이_적은_계정"
                    }], "skipped": [{"link": "a", "reason": "무관"}]}
                    """.formatted(POST) + "\n```\n";

            GrokResponseParser.Result.Success result = success(response(text, List.of(POST), 1));

            assertThat(result.items()).containsExactly(new CollectedNews(
                    NewsSection.KOREA_STORE, NewsKind.ENTRY_RESERVATION, "네이버 예약 입장 안내",
                    LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 8), POST, true, null,
                    new NewsDetail("11/5 ~ 11/8", "치이카와샵 용산점",
                            List.of(new NewsDetail.Product("앉은 인형", "おすわりぬいぐるみ", "29,000원")),
                            new NewsDetail.Reservation("네이버 예약", "11/5~11/8", "11/4 12:00", null),
                            List.of("출고 중단"), "https://booking.naver.com/a", ACCOUNT)));
            assertThat(result.skippedPosts()).isEqualTo(1);
            assertThat(result.warnings()).isEmpty();
        }

        @Test
        @DisplayName("여러 output_text 조각은 이어 붙여서 읽는다")
        void joinsOutputTextParts() {
            String json = itemsJson(POST);
            ObjectNode response = response(json.substring(0, 10), List.of(POST), 1);
            ArrayNode content = (ArrayNode) response.path("output").path(0).path("content");
            content.addObject().put("type", "output_text").put("text", json.substring(10));
            content.addObject().put("type", "reasoning").put("text", "무시되는 조각");

            assertThat(success(response).items()).hasSize(1);
        }

        @Test
        @DisplayName("모르는 값은 null 이다: 빈 문자열, 미정, N/A, null 문자열은 모두 null 로 정리한다")
        void normalizesUnknownValuesToNull() {
            String text = """
                    {"items": [{
                      "section": "korea_store", "kind": "release", "title": "정상 제목",
                      "date_label": "  ", "location": "미정", "link": "",
                      "ref_url": "N/A",
                      "products": [{"name": "인형", "name_ja": "null", "price": "Unknown"}],
                      "reservation": {"method": "TBD", "period": "-", "open_at": "11/4 12:00", "note": ""}
                    }]}
                    """;

            CollectedNews news = success(response(text, List.of(), 1)).items().getFirst();

            assertThat(news.link()).isNull();
            assertThat(news.detail().dateLabel()).isNull();
            assertThat(news.detail().location()).isNull();
            assertThat(news.detail().refUrl()).isNull();
            assertThat(news.detail().products()).containsExactly(new NewsDetail.Product("인형", null, null));
            assertThat(news.detail().reservation()).isEqualTo(new NewsDetail.Reservation(null, null, "11/4 12:00", null));
        }

        @Test
        @DisplayName("타입이 틀린 필드나 없는 날짜는 그 값만 비워서 읽는다")
        void readsMistypedFieldsLeniently() {
            String text = """
                    {"items": [{
                      "section": "korea_store", "kind": "release", "title": "정상 제목",
                      "start_date": 20261105, "end_date": "2026-02-30",
                      "products": ["문자열", {"name": "인형", "price": 1000}],
                      "reservation": "네이버 예약", "notes": "한 줄 공지", "link": null
                    }, "객체가 아닌 소식"]}
                    """;

            CollectedNews news = success(response(text, List.of(), 1)).items().getFirst();

            assertThat(news.startDate()).isNull();
            assertThat(news.endDate()).isNull();
            assertThat(news.link()).isNull();
            assertThat(news.detail().products()).containsExactly(new NewsDetail.Product("인형", null, null));
            assertThat(news.detail().reservation()).isNull();
            assertThat(news.detail().notes()).isEmpty();
        }

        @Test
        @DisplayName("모델이 쓴 본문을 해석하지 못하면 그 구간은 실패로 보되, 이미 나간 사용량은 그대로 센다")
        void failsWhenContentIsNotItemsJson() {
            GrokResponseParser.Result result = parser.parse(LABEL, ACCOUNT,
                    response("소식이 없습니다", List.of(), 2).toString());

            GrokResponseParser.Result.Failure failure = (GrokResponseParser.Result.Failure) result;
            assertThat(failure.reason()).isEqualTo("[" + LABEL + "] 본문 JSON 해석 실패");
            assertThat(failure.usage().postsFetched()).isEqualTo(2);
            assertThat(failure.usage().calls()).isEqualTo(1);
        }

        @Test
        @DisplayName("items 가 빈 배열이면 소식이 없는 정상 결과다")
        void emptyItemsIsSuccess() {
            assertThat(success(response("{\"items\": []}", List.of(), 1)).items()).isEmpty();
        }
    }

    @Nested
    @DisplayName("형식 검사")
    class Validation {

        @Test
        @DisplayName("section·kind 가 허용 값이 아니거나 제목이 없으면 그 소식만 버리고 이유를 남긴다")
        void discardsInvalidItems() {
            String text = """
                    {"items": [
                      {"section": "global", "kind": "release", "title": "해외 팝업", "link": "https://x.com/a/status/1"},
                      {"section": "korea_store", "kind": "신상품", "title": "모르는 종류"},
                      {"section": "korea_store", "kind": "予約", "title": "일본어 종류"},
                      {"section": "korea_store", "kind": "release", "title": "  "},
                      {"section": "korea_store", "kind": "restock", "title": "재입고"}
                    ]}
                    """;

            GrokResponseParser.Result.Success result = success(response(text, List.of(), 1));

            assertThat(result.items()).extracting(CollectedNews::kind).containsExactly(NewsKind.RESTOCK);
            assertThat(result.discarded()).extracting(GrokResponseParser.Discarded::reason).containsExactly(
                    "section 허용 값 아님: global", "kind 허용 값 아님: 신상품", "kind 허용 값 아님: 予約", "제목 없음");
            assertThat(result.discarded().getFirst().warning()).isEqualTo("버린 소식: 해외 팝업 (section 허용 값 아님: global)");
        }
    }

    @Nested
    @DisplayName("링크 검증과 사용량")
    class LinkVerificationAndUsage {

        @Test
        @DisplayName("citations(문자열·객체)와 응답 안 어디든 있는 url 을 정규화해 대조한다")
        void verifiesAgainstAllCitedUrls() {
            String annotated = "https://x.com/chiikawa_kouhou/status/2118508673865551977";
            String text = """
                    {"items": [
                      {"section": "korea_store", "kind": "release", "title": "citations", "link": "https://twitter.com/chiikawashop_kr/status/2119700000000000000?s=20"},
                      {"section": "korea_store", "kind": "release", "title": "annotation", "link": "%s"},
                      {"section": "korea_store", "kind": "release", "title": "없는 링크", "link": "https://x.com/chiikawashop_kr/status/1"}
                    ]}
                    """.formatted(annotated);
            ObjectNode response = response(text, List.of(), 1);
            response.putArray("citations").addObject().put("url", POST);
            ((ObjectNode) response.path("output").path(0).path("content").path(0))
                    .putArray("annotations").addObject().put("url", annotated);

            assertThat(success(response).items()).extracting(CollectedNews::linkVerified).containsExactly(true, true, false);
        }

        @Test
        @DisplayName("응답에 URL 이 하나도 없거나 링크가 비어 있으면 판단을 보류한다")
        void nullWhenNothingToCompare() {
            assertThat(success(response(itemsJson(POST), List.of(), 1)).items().getFirst().linkVerified()).isNull();
            assertThat(success(response(itemsJson(""), List.of(POST), 1)).items().getFirst().linkVerified()).isNull();
        }

        @Test
        @DisplayName("게시물을 10건 이상 가져오면 검색 상한 경고를 남긴다")
        void warnsAtSearchLimit() {
            assertThat(success(response(itemsJson(POST), List.of(POST), 10)).warnings()).singleElement().asString()
                    .startsWith("[" + LABEL + "] 게시물 10건 — 검색 상한(10건)");
            assertThat(success(response(itemsJson(POST), List.of(POST), 9)).warnings()).isEmpty();
        }
    }

    private GrokResponseParser.Result.Success success(final ObjectNode response) {
        GrokResponseParser.Result result = parser.parse(LABEL, ACCOUNT, response.toString());
        assertThat(result).isInstanceOf(GrokResponseParser.Result.Success.class);
        return (GrokResponseParser.Result.Success) result;
    }

    private String itemsJson(final String link) {
        return """
                {"items": [{"section": "korea_store", "kind": "release", "title": "입고 리스트", "link": "%s"}]}
                """.formatted(link);
    }

    private ObjectNode response(final String text, final List<String> citations, final int postsFetched) {
        ObjectNode response = objectMapper.createObjectNode();
        response.putArray("output").addObject().put("type", "message")
                .putArray("content").addObject().put("type", "output_text").put("text", text);
        ArrayNode citationArray = response.putArray("citations");
        citations.forEach(citationArray::add);
        response.putObject("usage").putObject("server_side_tool_usage_details").put("x_posts_fetched", postsFetched);
        return response;
    }
}
