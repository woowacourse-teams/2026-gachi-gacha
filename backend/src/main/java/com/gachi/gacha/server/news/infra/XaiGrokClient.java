package com.gachi.gacha.server.news.infra;

import com.gachi.gacha.server.news.domain.CollectCall;
import java.time.Duration;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * xAI Responses API 클라이언트. 요청 형식은 수집 스크립트(grok_news_json.sh)와 같다.
 *
 * <pre>
 * POST {base-url}/responses
 * {
 *   "model": "grok-4.3",
 *   "input": [{"role": "system", ...}, {"role": "user", ...}],
 *   "tools": [{"type": "x_search", "allowed_x_handles": ["계정"], "from_date": "...", "to_date": "..."},
 *             {"type": "web_search"}],
 *   "max_turns": 3
 * }
 * </pre>
 *
 * <p>기간은 검색어가 아니라 도구의 from_date, to_date 로만 제한한다. 마지막 구간은 to_date 를 넣지 않는다.
 * 실패 메시지에 API 키는 넣지 않는다.
 */
public class XaiGrokClient {

    private static final int ERROR_PREVIEW_LENGTH = 300;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String url;
    private final String model;
    private final @Nullable String apiKey;

    public XaiGrokClient(
            final RestTemplate restTemplate,
            final ObjectMapper objectMapper,
            final String baseUrl,
            final String model,
            @Nullable final String apiKey
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.url = baseUrl + "/responses";
        this.model = model;
        this.apiKey = apiKey;
    }

    /**
     * 한 번만 호출한다. 재시도는 호출하는 쪽이 비용·호출 수 상한을 보면서 한다.
     *
     * @return 응답 본문 그대로. 해석은 {@link GrokResponseParser} 가 한다
     * @throws CallException 네트워크 오류, 타임아웃, 2xx 가 아닌 응답
     */
    public String respond(final CollectCall call, final String systemPrompt, final String userPrompt, final int maxTurns) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new CallException("[" + call.label() + "] XAI_API_KEY 가 설정되지 않았다");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        String body = requestBody(call, systemPrompt, userPrompt, maxTurns).toString();
        try {
            String response = restTemplate.postForObject(url, new HttpEntity<>(body, headers), String.class);
            return response == null ? "" : response;
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            boolean retryable = status == 429 || status >= 500;
            throw new CallException("[" + call.label() + "] HTTP " + status + " " + preview(e.getResponseBodyAsString()),
                    retryable, RetryBackoff.retryAfter(e.getResponseHeaders()), false);
        } catch (ResourceAccessException e) {
            throw new CallException("[" + call.label() + "] 호출 실패 (네트워크/타임아웃)", true, null, true);
        } catch (RestClientException e) {
            throw new CallException("[" + call.label() + "] 호출 실패: " + e.getClass().getSimpleName());
        }
    }

    ObjectNode requestBody(final CollectCall call, final String systemPrompt, final String userPrompt, final int maxTurns) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        ArrayNode input = body.putArray("input");
        input.addObject().put("role", "system").put("content", systemPrompt);
        input.addObject().put("role", "user").put("content", userPrompt);

        ArrayNode tools = body.putArray("tools");
        ObjectNode xSearch = tools.addObject().put("type", "x_search");
        xSearch.set("allowed_x_handles", objectMapper.valueToTree(List.of(call.target().handle())));
        xSearch.put("from_date", call.from().toString());
        if (call.to() != null) {
            xSearch.put("to_date", call.to().toString());
        }
        if (call.target().webSearch()) {
            tools.addObject().put("type", "web_search");
        }
        body.put("max_turns", maxTurns);
        return body;
    }

    private String preview(final String responseBody) {
        String singleLine = responseBody == null ? "" : responseBody.replace('\n', ' ');
        return singleLine.length() > ERROR_PREVIEW_LENGTH ? singleLine.substring(0, ERROR_PREVIEW_LENGTH) : singleLine;
    }

    /**
     * Grok 호출 자체가 실패했다. 어느 구간이 실패했는지 메시지에 호출 이름이 들어 있다.
     */
    public static class CallException extends RuntimeException {

        private final boolean retryable;
        private final @Nullable Duration retryAfter;
        private final boolean timedOut;

        public CallException(final String message) {
            this(message, false, null, false);
        }

        /**
         * @param retryable 타임아웃, 429, 5xx 처럼 다시 시도해 볼 만한 실패인지
         * @param retryAfter 서버가 알려준 대기 시간
         * @param timedOut  응답을 받지 못해 비용이 얼마나 나갔는지 알 수 없는 실패인지
         */
        public CallException(
                final String message,
                final boolean retryable,
                @Nullable final Duration retryAfter,
                final boolean timedOut
        ) {
            super(message);
            this.retryable = retryable;
            this.retryAfter = retryAfter;
            this.timedOut = timedOut;
        }

        public boolean isRetryable() {
            return retryable;
        }

        public @Nullable Duration retryAfter() {
            return retryAfter;
        }

        public boolean isTimedOut() {
            return timedOut;
        }
    }
}
