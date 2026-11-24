package com.gachi.gacha.server.news.infra;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * 슬랙 Web API 클라이언트. 웹훅이 아니라 봇 토큰으로 보내야 같은 메시지를 다시 그리고(chat.update) 스레드에 답할 수 있다.
 *
 * <p>슬랙은 실패해도 HTTP 200 에 {"ok": false, "error": "..."} 를 돌려주므로 ok 값으로 성공을 판단한다.
 * 네트워크 오류, 429, 5xx 만 재시도하고, ok 가 false 인 응답(채널 없음, 권한 없음 등)은 다시 해도 같아서 재시도하지 않는다.
 * 봇 토큰이 없으면(로컬·테스트) 호출하지 않고 보낼 메시지를 로그로 남긴다. 로그와 예외 메시지에 토큰은 넣지 않는다.
 */
@Slf4j
public class SlackClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final @Nullable String botToken;
    private final RetryBackoff backoff;

    public SlackClient(
            final RestTemplate restTemplate,
            final ObjectMapper objectMapper,
            final String baseUrl,
            @Nullable final String botToken,
            final RetryBackoff backoff
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.botToken = botToken;
        this.backoff = backoff;
    }

    /**
     * @return 보낸 메시지의 ts (메시지 ID). 봇 토큰이 없으면 null
     */
    public @Nullable String postMessage(final String channel, final SlackMessage message) {
        ObjectNode body = message.toBody(objectMapper).put("channel", channel);
        JsonNode response = call("chat.postMessage", body);
        return response == null ? null : response.path("ts").asString(null);
    }

    /**
     * 그 사람에게만 보이는 안내. 승인자가 아닌 사람이 버튼을 눌렀을 때 쓴다.
     */
    public void postEphemeral(final String channel, final String userId, final String text) {
        call("chat.postEphemeral", objectMapper.createObjectNode()
                .put("channel", channel).put("user", userId).put("text", text));
    }

    private @Nullable JsonNode call(final String method, final ObjectNode body) {
        if (botToken == null || botToken.isBlank()) {
            log.info("[슬랙 미발송] 봇 토큰 없음. method = {}, message = {}", method, body);
            return null;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8));
        headers.setBearerAuth(botToken);
        HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);

        String response = post(method, request);
        JsonNode json = objectMapper.readTree(response == null ? "{}" : response);
        if (!json.path("ok").asBoolean(false)) {
            throw new SlackException(method + " 실패: " + json.path("error").asString("unknown"));
        }
        return json;
    }

    private @Nullable String post(final String method, final HttpEntity<String> request) {
        for (int attempt = 0; ; attempt++) {
            try {
                return restTemplate.postForObject(baseUrl + "/" + method, request, String.class);
            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                if (!(status == 429 || status >= 500) || attempt >= RetryBackoff.MAX_RETRIES) {
                    throw new SlackException(method + " 호출 실패: HTTP " + status);
                }
                waitBeforeRetry(method, attempt + 1, RetryBackoff.retryAfter(e.getResponseHeaders()));
            } catch (ResourceAccessException e) {
                if (attempt >= RetryBackoff.MAX_RETRIES) {
                    throw new SlackException(method + " 호출 실패: 네트워크/타임아웃");
                }
                waitBeforeRetry(method, attempt + 1, null);
            } catch (RestClientException e) {
                throw new SlackException(method + " 호출 실패: " + e.getClass().getSimpleName());
            }
        }
    }

    private void waitBeforeRetry(final String method, final int retryNumber, @Nullable final Duration retryAfter) {
        Duration delay = backoff.delay(retryNumber, retryAfter);
        log.warn("슬랙 호출을 다시 시도한다. method = {}, 재시도 = {}회, 대기 = {}초", method, retryNumber, delay.toSeconds());
        backoff.await(delay);
    }

    /**
     * 슬랙에 보낼 메시지. text 는 알림과 블록을 못 보여주는 곳에 쓰이고, blocks 가 실제 화면이다.
     */
    public record SlackMessage(String text, ArrayNode blocks) {

        ObjectNode toBody(final ObjectMapper objectMapper) {
            ObjectNode body = objectMapper.createObjectNode().put("text", text);
            body.set("blocks", blocks);
            return body;
        }
    }

    public static class SlackException extends RuntimeException {

        public SlackException(final String message) {
            super(message);
        }
    }
}
