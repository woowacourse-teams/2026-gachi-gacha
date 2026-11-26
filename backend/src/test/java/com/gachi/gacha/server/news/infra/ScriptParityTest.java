package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.news.domain.CollectedNews;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsDetail;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * 수집 스크립트(grok_news_json.sh)와 서버의 응답 해석·후처리가 같은 결과를 내는지 확인한다.
 *
 * <p>기대값은 src/test/resources/news/golden/generate_expected.sh 가 스크립트의 jq 식을 고정 응답에 그대로
 * 실행해서 만든 파일이다. 응답이나 스크립트 규칙이 바뀌면 그 스크립트로 기대값을 다시 만든다.
 * 서버 결과(record)를 스크립트가 쓰는 JSON 필드 이름으로 바꿔서 필드 하나하나까지 비교한다.
 */
class ScriptParityTest {

    private static final String GOLDEN = "/news/golden/";
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 9);
    private static final Map<String, String> HANDLES = new LinkedHashMap<>();

    static {
        HANDLES.put("KR_shop", "chiikawashop_kr");
        HANDLES.put("KR_market", "chiikawa_m_kr");
        HANDLES.put("JP_market", "chiikawa_market");
        HANDLES.put("JP_kouhou", "chiikawa_kouhou");
    }

    private final ObjectMapper objectMapper = JsonMapper.builder().build();
    private final GrokResponseParser parser = new GrokResponseParser(objectMapper);

    private NewsPostProcessor.Result result;
    private GrokUsage usage = GrokUsage.NONE;
    private final List<String> warnings = new ArrayList<>();
    private int skippedPosts;
    private int discarded;

    @BeforeEach
    void setUp() throws IOException {
        List<CollectedNews> merged = new ArrayList<>();
        for (Map.Entry<String, String> target : HANDLES.entrySet()) {
            String label = target.getKey();
            GrokResponseParser.Result.Success success = (GrokResponseParser.Result.Success)
                    parser.parse(label, target.getValue(), read("responses/res_" + label + ".json"));
            merged.addAll(success.items());
            usage = usage.plus(success.usage());
            warnings.addAll(success.warnings());
            skippedPosts += success.skippedPosts();
            discarded += success.discarded().size();
        }
        result = new NewsPostProcessor().process(merged, TODAY, "10:30 ~ 22:00");
    }

    @Test
    @DisplayName("공개 후보(끝나지 않은 소식)와 지난 소식이 스크립트 결과와 필드까지 같다")
    void matchesScript() throws IOException {
        assertThat(toScriptJson(result.items())).isEqualTo(objectMapper.readTree(read("expected_items.json")));
        assertThat(toScriptJson(result.endedItems())).isEqualTo(objectMapper.readTree(read("expected_ended.json")));
    }

    @Test
    @DisplayName("버린 소식 없이 중복 1건만 빠지고, 사용량·제외 게시물·10건 상한 경고를 스크립트처럼 모은다")
    void aggregatesLikeScript() {
        assertThat(discarded).isZero();
        assertThat(result.duplicateCount()).isEqualTo(1);
        assertThat(usage).isEqualTo(new GrokUsage(4, 1, 20, 0, 37000, 5400, 690_000_000));
        assertThat(usage.formattedCostUsd()).isEqualTo("0.0690");
        assertThat(usage.costUsd()).isEqualTo(0.069);
        assertThat(skippedPosts).isEqualTo(2);
        assertThat(warnings).singleElement().asString().startsWith("[JP_market] 게시물 10건");
    }

    private JsonNode toScriptJson(final List<CollectedNews> items) {
        ArrayNode array = objectMapper.createArrayNode();
        items.forEach(news -> array.add(toScriptJson(news)));
        return array;
    }

    /**
     * 스크립트 결과(items.json)와 같은 필드 이름과 표현으로 바꾼다. 스크립트는 빈 링크를 "" 로 둔다.
     */
    private ObjectNode toScriptJson(final CollectedNews news) {
        NewsDetail detail = news.detail();
        ObjectNode node = objectMapper.createObjectNode()
                .put("section", news.section().getValue())
                .put("kind", news.kind().getValue())
                .put("title", news.title())
                .put("start_date", news.startDate() == null ? null : news.startDate().toString())
                .put("end_date", news.endDate() == null ? null : news.endDate().toString())
                .put("date_label", detail.dateLabel())
                .put("location", detail.location());
        ArrayNode products = node.putArray("products");
        detail.products().forEach(product -> products.addObject()
                .put("name", product.name()).put("name_ja", product.nameJa()).put("price", product.price()));
        NewsDetail.Reservation reservation = detail.reservation();
        if (reservation == null) {
            node.putNull("reservation");
        } else {
            node.putObject("reservation").put("method", reservation.method()).put("period", reservation.period())
                    .put("open_at", reservation.openAt()).put("note", reservation.note());
        }
        ArrayNode notes = node.putArray("notes");
        detail.notes().forEach(notes::add);
        return node
                .put("link", news.link() == null ? "" : news.link())
                .put("ref_url", detail.refUrl())
                .put("source_account", detail.sourceAccount())
                .put("link_verified", news.linkVerified())
                .put("timing", news.timing() == null ? null : news.timing().getLabel());
    }

    private String read(final String path) throws IOException {
        try (InputStream input = getClass().getResourceAsStream(GOLDEN + path)) {
            assertThat(input).as(path).isNotNull();
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
