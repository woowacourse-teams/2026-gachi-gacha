package com.gachi.gacha.server.news.domain;

import java.util.Locale;
import tools.jackson.databind.JsonNode;

/**
 * Grok 사용량. 호출마다 더해서 회차 전체의 호출 수·검색량·토큰·비용을 남긴다(news_batch.usage).
 *
 * @param calls     보낸 호출 수. 실패한 호출도 센다(스크립트와 같음)
 * @param costTicks xAI 가 응답에 넣어주는 실제 비용. 1 tick = 1/10,000,000,000 달러
 */
public record GrokUsage(
        int calls,
        long webSearchCalls,
        long postsFetched,
        long usersFetched,
        long inputTokens,
        long outputTokens,
        long costTicks
) {

    public static final GrokUsage NONE = new GrokUsage(0, 0, 0, 0, 0, 0, 0);
    public static final GrokUsage FAILED_CALL = new GrokUsage(1, 0, 0, 0, 0, 0, 0);

    private static final double TICKS_PER_USD = 10_000_000_000d;

    /**
     * 실제 비용이 없을 때 쓰는 grok-4.3 단가 (스크립트와 같음).
     */
    private static final double INPUT_USD_PER_TOKEN = 1.25 / 1_000_000;
    private static final double OUTPUT_USD_PER_TOKEN = 2.5 / 1_000_000;
    private static final double POST_USD = 0.005;
    private static final double USER_USD = 0.01;
    private static final double WEB_SEARCH_USD = 0.005;

    /**
     * 응답 하나의 사용량. 없는 값은 0 이다.
     */
    public static GrokUsage of(final JsonNode response) {
        JsonNode usage = response.path("usage");
        JsonNode tools = usage.path("server_side_tool_usage_details");
        return new GrokUsage(
                1,
                tools.path("web_search_calls").asLong(0),
                tools.path("x_posts_fetched").asLong(0),
                tools.path("x_users_fetched").asLong(0),
                usage.path("input_tokens").asLong(0),
                usage.path("output_tokens").asLong(0),
                usage.path("cost_in_usd_ticks").asLong(0)
        );
    }

    public GrokUsage plus(final GrokUsage other) {
        return new GrokUsage(
                calls + other.calls,
                webSearchCalls + other.webSearchCalls,
                postsFetched + other.postsFetched,
                usersFetched + other.usersFetched,
                inputTokens + other.inputTokens,
                outputTokens + other.outputTokens,
                costTicks + other.costTicks
        );
    }

    public boolean hasActualCost() {
        return costTicks > 0;
    }

    /**
     * 비용 상한 판단에 쓰는 달러 값. 실제 비용을 쓰고, 값이 없으면 단가로 추정한다.
     */
    public double costUsd() {
        return hasActualCost() ? costTicks / TICKS_PER_USD : estimatedCostUsd();
    }

    /**
     * 보고에 쓰는 표기. 자릿수는 스크립트와 같다(실제 4자리, 추정 3자리).
     */
    public String formattedCostUsd() {
        return String.format(Locale.ROOT, hasActualCost() ? "%.4f" : "%.3f", costUsd());
    }

    private double estimatedCostUsd() {
        return postsFetched * POST_USD
                + usersFetched * USER_USD
                + webSearchCalls * WEB_SEARCH_USD
                + inputTokens * INPUT_USD_PER_TOKEN
                + outputTokens * OUTPUT_USD_PER_TOKEN;
    }
}
