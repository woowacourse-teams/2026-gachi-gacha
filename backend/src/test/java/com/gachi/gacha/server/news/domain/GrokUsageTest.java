package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

class GrokUsageTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @Test
    @DisplayName("응답의 usage 를 호출 1회로 읽고 없는 값은 0 으로 본다")
    void readsUsageWithDefaults() {
        GrokUsage usage = GrokUsage.of(objectMapper.readTree("""
                {"usage": {"input_tokens": 100, "output_tokens": 20,
                  "server_side_tool_usage_details": {"x_posts_fetched": 7}}}
                """));

        assertThat(usage).isEqualTo(new GrokUsage(1, 0, 7, 0, 100, 20, 0));
        assertThat(GrokUsage.of(objectMapper.readTree("{}"))).isEqualTo(new GrokUsage(1, 0, 0, 0, 0, 0, 0));
    }

    @Test
    @DisplayName("호출마다 사용량을 더하고, 실패한 호출도 호출 수에 센다")
    void addsUsage() {
        GrokUsage first = new GrokUsage(1, 1, 3, 0, 9000, 1200, 180_000_000);
        GrokUsage second = new GrokUsage(1, 0, 10, 1, 12000, 2000, 250_000_000);

        assertThat(first.plus(second).plus(GrokUsage.FAILED_CALL))
                .isEqualTo(new GrokUsage(3, 1, 13, 1, 21000, 3200, 430_000_000));
    }

    @Test
    @DisplayName("실제 비용이 있으면 달러로 넷째 자리까지, 없으면 스크립트 단가로 셋째 자리까지 추정한다")
    void formatsCost() {
        assertThat(new GrokUsage(16, 0, 36, 0, 134975, 13446, 3_126_000_000L).formattedCostUsd()).isEqualTo("0.3126");
        // 36*0.005 + 1*0.01 + 2*0.005 + 134975*1.25/1e6 + 13446*2.5/1e6 = 0.4023...
        assertThat(new GrokUsage(16, 2, 36, 1, 134975, 13446, 0).formattedCostUsd()).isEqualTo("0.402");
    }

    @Test
    @DisplayName("비용 상한 판단에 쓰는 달러 값도 실제 비용이 있으면 그 값, 없으면 추정값이다")
    void costUsd() {
        assertThat(new GrokUsage(16, 0, 36, 0, 134975, 13446, 3_126_000_000L).costUsd()).isEqualTo(0.3126);
        assertThat(new GrokUsage(16, 2, 36, 1, 134975, 13446, 0).costUsd()).isCloseTo(0.4023, org.assertj.core.data.Offset.offset(0.0001));
        assertThat(GrokUsage.NONE.costUsd()).isZero();    }
}
