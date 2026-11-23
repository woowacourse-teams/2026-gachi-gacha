package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.gachi.gacha.server.news.domain.CollectCall;
import com.gachi.gacha.server.news.domain.CollectTarget;
import java.net.SocketTimeoutException;
import java.time.Duration;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

class XaiGrokClientTest {

    private static final String BASE_URL = "https://api.x.ai/v1";
    private static final String API_KEY = "xai-test-key";
    private static final CollectTarget KR_SHOP = new CollectTarget("KR_shop", "chiikawashop_kr", 2, true, "");
    private static final CollectTarget JP_KOUHOU = new CollectTarget("JP_kouhou", "chiikawa_kouhou", 7, false, "");

    private final ObjectMapper objectMapper = JsonMapper.builder().build();
    private final RestTemplate restTemplate = new RestTemplate();

    private MockRestServiceServer server;
    private XaiGrokClient client;

    @BeforeEach
    void setUp() {
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new XaiGrokClient(restTemplate, objectMapper, BASE_URL, "grok-4.3", API_KEY);
    }

    @Test
    @DisplayName("스크립트와 같은 형식으로 요청한다: 계정 하나, 기간 제한, 웹 검색, 라운드 상한")
    void sendsScriptRequestFormat() {
        server.expect(requestTo(BASE_URL + "/responses"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer " + API_KEY))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {
                          "model": "grok-4.3",
                          "input": [{"role": "system", "content": "시스템"}, {"role": "user", "content": "사용자"}],
                          "tools": [
                            {"type": "x_search", "allowed_x_handles": ["chiikawashop_kr"],
                             "from_date": "2026-11-09", "to_date": "2026-11-11"},
                            {"type": "web_search"}
                          ],
                          "max_turns": 3
                        }
                        """, true))
                .andRespond(withSuccess("{\"id\":\"resp\"}", MediaType.APPLICATION_JSON));

        String response = client.respond(new CollectCall(KR_SHOP, LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 11)),
                "시스템", "사용자", 3);

        assertThat(response).isEqualTo("{\"id\":\"resp\"}");
        server.verify();
    }

    @Test
    @DisplayName("마지막 구간은 to_date 없이, 웹 검색을 안 쓰는 계정은 x_search 만 보낸다")
    void omitsToDateAndWebSearch() {
        server.expect(requestTo(BASE_URL + "/responses"))
                .andExpect(content().json("""
                        {
                          "model": "grok-4.3",
                          "input": [{"role": "system", "content": "시스템"}, {"role": "user", "content": "사용자"}],
                          "tools": [{"type": "x_search", "allowed_x_handles": ["chiikawa_kouhou"], "from_date": "2026-11-05"}],
                          "max_turns": 2
                        }
                        """, true))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        client.respond(new CollectCall(JP_KOUHOU, LocalDate.of(2026, 11, 5), null), "시스템", "사용자", 2);

        server.verify();
    }

    @Test
    @DisplayName("2xx 가 아니면 상태 코드와 응답 앞부분으로 실패를 알리고, API 키는 메시지에 넣지 않는다")
    void failsOnErrorStatus() {
        server.expect(requestTo(BASE_URL + "/responses"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"rate limited\"}"));

        assertThatThrownBy(() -> client.respond(call(), "시스템", "사용자", 3))
                .isInstanceOf(XaiGrokClient.CallException.class)
                .hasMessage("[KR_shop_2026-11-09] HTTP 429 {\"error\":\"rate limited\"}")
                .hasMessageNotContaining(API_KEY);
    }

    @Test
    @DisplayName("429 는 서버가 알려준 대기 시간과 함께 다시 시도할 수 있는 실패다")
    void tooManyRequestsIsRetryable() {
        server.expect(requestTo(BASE_URL + "/responses"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After", "7").body("{}"));

        assertThatThrownBy(() -> client.respond(call(), "시스템", "사용자", 3))
                .isInstanceOfSatisfying(XaiGrokClient.CallException.class, e -> {
                    assertThat(e.isRetryable()).isTrue();
                    assertThat(e.retryAfter()).isEqualTo(Duration.ofSeconds(7));
                    assertThat(e.isTimedOut()).isFalse();
                });
    }

    @Test
    @DisplayName("5xx 는 다시 시도할 수 있고, 429 를 뺀 4xx 는 다시 시도하지 않는다")
    void retryableOnlyForServerErrors() {
        server.expect(requestTo(BASE_URL + "/responses")).andRespond(withStatus(HttpStatus.BAD_GATEWAY).body("{}"));
        server.expect(requestTo(BASE_URL + "/responses")).andRespond(withStatus(HttpStatus.BAD_REQUEST).body("{}"));
        server.expect(requestTo(BASE_URL + "/responses")).andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{}"));

        assertThatThrownBy(() -> client.respond(call(), "시스템", "사용자", 3))
                .isInstanceOfSatisfying(XaiGrokClient.CallException.class, e -> assertThat(e.isRetryable()).isTrue());
        assertThatThrownBy(() -> client.respond(call(), "시스템", "사용자", 3))
                .isInstanceOfSatisfying(XaiGrokClient.CallException.class, e -> assertThat(e.isRetryable()).isFalse());
        assertThatThrownBy(() -> client.respond(call(), "시스템", "사용자", 3))
                .isInstanceOfSatisfying(XaiGrokClient.CallException.class, e -> assertThat(e.isRetryable()).isFalse());
    }

    @Test
    @DisplayName("타임아웃·네트워크 오류는 호출 실패로 알리고, 다시 시도할 수 있지만 비용은 알 수 없다")
    void failsOnTimeout() {
        server.expect(requestTo(BASE_URL + "/responses"))
                .andRespond(withException(new SocketTimeoutException("read timed out")));

        assertThatThrownBy(() -> client.respond(call(), "시스템", "사용자", 3))
                .isInstanceOf(XaiGrokClient.CallException.class)
                .hasMessage("[KR_shop_2026-11-09] 호출 실패 (네트워크/타임아웃)")
                .isInstanceOfSatisfying(XaiGrokClient.CallException.class, e -> {
                    assertThat(e.isRetryable()).isTrue();
                    assertThat(e.isTimedOut()).isTrue();
                });
    }

    @Test
    @DisplayName("API 키가 없으면 호출하지 않고 실패한다")
    void failsWithoutApiKey() {
        XaiGrokClient withoutKey = new XaiGrokClient(restTemplate, objectMapper, BASE_URL, "grok-4.3", " ");

        assertThatThrownBy(() -> withoutKey.respond(call(), "시스템", "사용자", 3))
                .isInstanceOf(XaiGrokClient.CallException.class)
                .hasMessageContaining("XAI_API_KEY");
        server.verify();
    }

    private CollectCall call() {
        return new CollectCall(KR_SHOP, LocalDate.of(2026, 11, 9), null);
    }
}
