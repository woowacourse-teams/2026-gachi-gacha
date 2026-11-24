package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.gachi.gacha.server.news.infra.SlackClient.SlackMessage;
import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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

class SlackClientTest {

    private static final String API = "https://slack.com/api";
    private static final String TOKEN = "xoxb-test-token";

    private final ObjectMapper objectMapper = JsonMapper.builder().build();
    private final RestTemplate restTemplate = new RestTemplate();
    private final List<Duration> waited = new ArrayList<>();
    private final RetryBackoff backoff = new RetryBackoff() {
        @Override
        public void await(final Duration delay) {
            waited.add(delay);
        }
    };

    private MockRestServiceServer server;
    private SlackClient client;

    @BeforeEach
    void setUp() {
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new SlackClient(restTemplate, objectMapper, API, TOKEN, backoff);
    }

    @Test
    @DisplayName("봇 토큰으로 chat.postMessage 를 보내고 메시지 ts 를 돌려준다")
    void postsMessage() {
        server.expect(requestTo(API + "/chat.postMessage"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer " + TOKEN))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {"channel": "C0NEWS", "text": "치이카와 신상 소식", "blocks": [{"type": "divider"}]}
                        """, true))
                .andRespond(withSuccess("{\"ok\": true, \"ts\": \"1731382200.000100\"}", MediaType.APPLICATION_JSON));

        assertThat(client.postMessage("C0NEWS", message())).isEqualTo("1731382200.000100");
        server.verify();
        assertThat(waited).isEmpty();
    }

    @Test
    @DisplayName("chat.update 는 채널과 메시지 ts 를 붙여 같은 메시지를 다시 그리고, 일시 오류에도 다시 시도하지 않는다")
    void updatesMessageWithoutRetry() {
        server.expect(requestTo(API + "/chat.update"))
                .andExpect(header("Authorization", "Bearer " + TOKEN))
                .andExpect(content().json("""
                        {"channel": "C0NEWS", "ts": "1.1", "text": "치이카와 신상 소식", "blocks": [{"type": "divider"}]}
                        """, true))
                .andRespond(withServerError());

        assertThatThrownBy(() -> client.updateMessage("C0NEWS", "1.1", message()))
                .isInstanceOf(SlackClient.SlackException.class).hasMessage("chat.update 호출 실패: HTTP 500");
        server.verify();
        assertThat(waited).isEmpty();
    }

    @Test
    @DisplayName("chat.update 의 ok:false 응답은 오류 이유와 함께 던진다")
    void updateFailureCarriesReason() {
        server.expect(requestTo(API + "/chat.update"))
                .andRespond(withSuccess("{\"ok\": false, \"error\": \"message_not_found\"}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.updateMessage("C0NEWS", "1.1", message()))
                .isInstanceOf(SlackClient.SlackException.class).hasMessage("chat.update 실패: message_not_found");
    }

    @Test
    @DisplayName("chat.update 는 네트워크 오류에도 다시 시도하지 않는다")
    void updateDoesNotRetryNetworkErrors() {
        server.expect(requestTo(API + "/chat.update")).andRespond(withException(new SocketTimeoutException("read timed out")));

        assertThatThrownBy(() -> client.updateMessage("C0NEWS", "1.1", message()))
                .isInstanceOf(SlackClient.SlackException.class).hasMessageContaining("네트워크/타임아웃");
        server.verify();
        assertThat(waited).isEmpty();
    }

    @Test
    @DisplayName("봇 토큰이 없으면 chat.update 도 호출하지 않고 로그만 남긴다")
    void updateWithoutTokenDoesNotCall() {
        SlackClient withoutToken = new SlackClient(restTemplate, objectMapper, API, "", backoff);

        withoutToken.updateMessage("C0NEWS", "1.1", message());

        server.verify();
    }

    @Test
    @DisplayName("스레드 답글은 thread_ts 를 붙여 chat.postMessage 로 보내고, 일시 오류에도 다시 시도하지 않는다")
    void postsThreadReplyWithoutRetry() {
        server.expect(requestTo(API + "/chat.postMessage"))
                .andExpect(content().json("""
                        {"channel": "C0NEWS", "thread_ts": "1.1", "text": "발송 완료"}
                        """, true))
                .andRespond(withSuccess("{\"ok\": true, \"ts\": \"1.2\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(API + "/chat.postMessage")).andRespond(withServerError());

        client.postThreadReply("C0NEWS", "1.1", "발송 완료");
        assertThatThrownBy(() -> client.postThreadReply("C0NEWS", "1.1", "또 발송"))
                .isInstanceOf(SlackClient.SlackException.class).hasMessage("chat.postMessage 호출 실패: HTTP 500");

        server.verify();
        assertThat(waited).isEmpty();
    }

    @Test
    @DisplayName("5xx 는 2초, 4초 뒤에 다시 시도하고, 성공하면 그 결과를 돌려준다")
    void retriesServerErrors() {
        server.expect(requestTo(API + "/chat.postMessage")).andRespond(withServerError());
        server.expect(requestTo(API + "/chat.postMessage")).andRespond(withStatus(HttpStatus.BAD_GATEWAY));
        server.expect(requestTo(API + "/chat.postMessage"))
                .andRespond(withSuccess("{\"ok\": true, \"ts\": \"1.1\"}", MediaType.APPLICATION_JSON));

        assertThat(client.postMessage("C0NEWS", message())).isEqualTo("1.1");

        server.verify();
        assertThat(waited).containsExactly(Duration.ofSeconds(2), Duration.ofSeconds(4));
    }

    @Test
    @DisplayName("네트워크 오류도 다시 시도하고, 계속 실패하면 토큰 없이 예외로 알린다")
    void retriesNetworkErrors() {
        server.expect(requestTo(API + "/chat.postMessage")).andRespond(withException(new SocketTimeoutException("timeout")));
        server.expect(requestTo(API + "/chat.postMessage")).andRespond(withException(new SocketTimeoutException("timeout")));
        server.expect(requestTo(API + "/chat.postMessage")).andRespond(withException(new SocketTimeoutException("timeout")));

        assertThatThrownBy(() -> client.postMessage("C0NEWS", message()))
                .isInstanceOf(SlackClient.SlackException.class)
                .hasMessage("chat.postMessage 호출 실패: 네트워크/타임아웃")
                .hasMessageNotContaining(TOKEN);

        server.verify();
        assertThat(waited).containsExactly(Duration.ofSeconds(2), Duration.ofSeconds(4));
    }

    @Test
    @DisplayName("429 는 Retry-After 만큼 기다리고 (최대 30초), 재시도를 모두 써도 실패하면 예외로 알린다")
    void retriesRateLimitAndGivesUp() {
        server.expect(requestTo(API + "/chat.postMessage"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After", "10"));
        server.expect(requestTo(API + "/chat.postMessage"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After", "100"));
        server.expect(requestTo(API + "/chat.postMessage"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThatThrownBy(() -> client.postMessage("C0NEWS", message()))
                .isInstanceOf(SlackClient.SlackException.class)
                .hasMessage("chat.postMessage 호출 실패: HTTP 429")
                .hasMessageNotContaining(TOKEN);

        server.verify();
        assertThat(waited).containsExactly(Duration.ofSeconds(10), Duration.ofSeconds(30));
    }

    @Test
    @DisplayName("ok 가 false 인 응답과 4xx 는 다시 해도 같으므로 재시도하지 않는다")
    void doesNotRetryPermanentFailures() {
        server.expect(requestTo(API + "/chat.postMessage"))
                .andRespond(withSuccess("{\"ok\": false, \"error\": \"channel_not_found\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(API + "/chat.postMessage")).andRespond(withStatus(HttpStatus.FORBIDDEN));

        assertThatThrownBy(() -> client.postMessage("C0NEWS", message()))
                .isInstanceOf(SlackClient.SlackException.class)
                .hasMessage("chat.postMessage 실패: channel_not_found");
        assertThatThrownBy(() -> client.postMessage("C0NEWS", message()))
                .isInstanceOf(SlackClient.SlackException.class)
                .hasMessage("chat.postMessage 호출 실패: HTTP 403");

        server.verify();
        assertThat(waited).isEmpty();
    }

    @Test
    @DisplayName("봇 토큰이 없으면 호출하지 않고 ts 없이 끝난다 (로컬·테스트)")
    void skipsWithoutToken() {
        SlackClient withoutToken = new SlackClient(restTemplate, objectMapper, API, null, backoff);

        assertThat(withoutToken.postMessage("C0NEWS", message())).isNull();
        server.verify();
    }

    private SlackMessage message() {
        SlackMessage message = new SlackMessage("치이카와 신상 소식", objectMapper.createArrayNode());
        message.blocks().addObject().put("type", "divider");
        return message;
    }
}
