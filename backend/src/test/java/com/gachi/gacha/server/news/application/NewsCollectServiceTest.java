package com.gachi.gacha.server.news.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

import com.gachi.gacha.server.news.application.NewsBatchService.Started;
import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.CollectCall;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.CollectionPlanner;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import com.gachi.gacha.server.news.infra.GrokResponseParser;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.news.infra.NewsPromptRenderer;
import com.gachi.gacha.server.news.infra.RetryBackoff;
import com.gachi.gacha.server.news.infra.XaiGrokClient;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

class NewsCollectServiceTest {

    private static final String TOPIC = "CHIIKAWA";
    private static final String RUN = "THURSDAY";
    private static final String SHOP = "chiikawashop_kr";
    private static final String KOUHOU = "chiikawa_kouhou";
    private static final LocalDate FROM = LocalDate.of(2026, 11, 5);
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 12);
    /**
     * 치이카와샵은 7일을 2일씩 4번, 홍보 계정은 7일을 한 번에 호출해서 한 번의 수집이 5번 호출이다.
     */
    private static final int PLANNED_CALLS = 5;

    private final ObjectMapper objectMapper = JsonMapper.builder().build();
    private final NewsBatchService batchService = mock(NewsBatchService.class);
    private final XaiGrokClient grokClient = mock(XaiGrokClient.class);
    private final List<Duration> waited = new ArrayList<>();
    private final RetryBackoff backoff = new RetryBackoff() {
        @Override
        public void await(final Duration delay) {
            waited.add(delay);
        }
    };
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-12T03:30:00Z"), ZoneOffset.UTC);

    private NewsProperties properties = NewsFixtures.properties(false, "", 40, 0.6);

    @BeforeEach
    void setUp() {
        given(batchService.begin(eq(TOPIC), eq(RUN), anyList(), any(), eq(TODAY))).willReturn(Optional.of(started()));
        given(batchService.complete(anyLong(), any(), anySet(), any(), anyList(), anyInt(), anyInt()))
                .willAnswer(invocation -> finished());
        given(batchService.fail(anyLong(), any(), anyList())).willAnswer(invocation -> finished());
    }

    @Nested
    @DisplayName("정상 수집")
    class Success {

        @Test
        @DisplayName("계획한 구간을 모두 호출하고, 모든 계정을 수집한 것으로 저장한다")
        void collectsAllCalls() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt())).willReturn(response(15, "용산점 입고"));

            NewsRunResult result = service().collect(TOPIC, RUN);

            assertThat(result).isInstanceOf(NewsRunResult.Finished.class);
            then(grokClient).should(times(PLANNED_CALLS)).respond(any(), anyString(), anyString(), anyInt());
            assertThat(capturedHandles()).containsExactlyInAnyOrder(SHOP, KOUHOU);
            assertThat(capturedUsage().calls()).isEqualTo(PLANNED_CALLS);
            assertThat(waited).isEmpty();
        }

        @Test
        @DisplayName("프롬프트에 계정·기간·오늘 날짜를 채우고, 웹 검색을 쓰는 계정은 라운드를 하나 더 준다")
        void rendersPromptAndTurns() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt())).willReturn(response(15, "입고"));

            service().collect(TOPIC, RUN);

            ArgumentCaptor<CollectCall> calls = ArgumentCaptor.forClass(CollectCall.class);
            ArgumentCaptor<String> system = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> user = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<Integer> turns = ArgumentCaptor.forClass(Integer.class);
            then(grokClient).should(times(PLANNED_CALLS)).respond(calls.capture(), system.capture(), user.capture(), turns.capture());
            assertThat(calls.getAllValues().getFirst().target().handle()).isEqualTo(SHOP);
            assertThat(user.getAllValues().getFirst()).contains("오늘 날짜: 2026-11-12").contains("@chiikawashop_kr")
                    .contains("검색 기간: 2026-11-05 ~ 2026-11-07 직전");
            assertThat(system.getAllValues().getFirst()).startsWith("당신은 치이카와(ちいかわ)");
            assertThat(turns.getAllValues()).containsExactly(3, 3, 3, 3, 2);
        }
    }

    @Nested
    @DisplayName("재시도")
    class Retry {

        @Test
        @DisplayName("일시 오류는 2초 뒤 다시 시도하고, 성공하면 그 계정은 수집한 것이다. 실패한 시도도 호출 수에 센다")
        void retriesTransientError() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt()))
                    .willThrow(new XaiGrokClient.CallException("[KR_shop_2026-11-05] HTTP 503", true, null, false))
                    .willReturn(response(15, "입고"));

            service().collect(TOPIC, RUN);

            then(grokClient).should(times(PLANNED_CALLS + 1)).respond(any(), anyString(), anyString(), anyInt());
            assertThat(waited).containsExactly(Duration.ofSeconds(2));
            assertThat(capturedHandles()).containsExactlyInAnyOrder(SHOP, KOUHOU);
            assertThat(capturedUsage().calls()).isEqualTo(PLANNED_CALLS + 1);
        }

        @Test
        @DisplayName("재시도를 모두 써도 실패하면 그 계정만 수집하지 못한 것으로 남기고, 나머지 계정은 계속 수집한다")
        void exhaustedRetriesFailOnlyThatAccount() {
            XaiGrokClient.CallException unavailable = new XaiGrokClient.CallException("[KR_shop_2026-11-05] HTTP 503", true, null, false);
            given(grokClient.respond(any(), anyString(), anyString(), anyInt())).willAnswer(invocation -> {
                CollectCall call = invocation.getArgument(0);
                if (call.target().handle().equals(SHOP) && call.from().equals(FROM)) {
                    throw unavailable;
                }
                return response(15, "입고 " + call.label());
            });

            service().collect(TOPIC, RUN);

            assertThat(waited).containsExactly(Duration.ofSeconds(2), Duration.ofSeconds(4));
            assertThat(capturedHandles()).containsExactly(KOUHOU);
            assertThat(capturedWarnings()).contains("[KR_shop_2026-11-05] HTTP 503");
            then(batchService).should(never()).fail(anyLong(), any(), anyList());
        }

        @Test
        @DisplayName("429 를 뺀 4xx 와 본문 해석 실패는 다시 시도하지 않는다")
        void doesNotRetryPermanentFailures() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt())).willAnswer(invocation -> {
                CollectCall call = invocation.getArgument(0);
                if (call.target().handle().equals(KOUHOU)) {
                    return "{\"output\": []}";
                }
                throw new XaiGrokClient.CallException("[" + call.label() + "] HTTP 400");
            });

            NewsRunResult result = service().collect(TOPIC, RUN);

            assertThat(waited).isEmpty();
            then(grokClient).should(times(PLANNED_CALLS)).respond(any(), anyString(), anyString(), anyInt());
            then(batchService).should().fail(anyLong(), any(), anyList());
            assertThat(result).isInstanceOf(NewsRunResult.Finished.class);
        }

        @Test
        @DisplayName("서버가 Retry-After 로 알려준 시간만큼 기다린 뒤 다시 시도한다")
        void followsRetryAfter() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt()))
                    .willThrow(new XaiGrokClient.CallException("HTTP 429", true, Duration.ofSeconds(10), false))
                    .willReturn(response(15, "입고"));

            service().collect(TOPIC, RUN);

            assertThat(waited).containsExactly(Duration.ofSeconds(10));
        }

        @Test
        @DisplayName("응답을 받지 못한 호출은 비용을 알 수 없다고 보고에 남긴다")
        void reportsUnknownCostForTimeouts() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt()))
                    .willThrow(new XaiGrokClient.CallException("[KR_shop_2026-11-05] 호출 실패 (네트워크/타임아웃)", true, null, true))
                    .willReturn(response(15, "입고"));

            service().collect(TOPIC, RUN);

            assertThat(capturedWarnings()).contains("응답을 받지 못해 비용을 알 수 없는 호출 1건 (타임아웃)");
        }
    }

    @Nested
    @DisplayName("부분 실패와 전체 실패")
    class Failures {

        @Test
        @DisplayName("한 계정의 일부 구간만 실패해도 그 계정은 수집한 것으로 기록하지 않아서 다음 수집이 같은 기간부터 다시 가져온다")
        void partialChunkFailureKeepsCursor() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt())).willAnswer(invocation -> {
                CollectCall call = invocation.getArgument(0);
                if (call.target().handle().equals(SHOP) && call.from().equals(FROM.plusDays(2))) {
                    throw new XaiGrokClient.CallException("[" + call.label() + "] HTTP 400");
                }
                return response(15, "입고 " + call.label());
            });

            service().collect(TOPIC, RUN);

            assertThat(capturedHandles()).containsExactly(KOUHOU);
            assertThat(capturedWarnings()).contains("[KR_shop_2026-11-07] HTTP 400");
            // 성공한 구간의 소식은 버리지 않는다
            ArgumentCaptor<NewsPostProcessor.Result> result = ArgumentCaptor.forClass(NewsPostProcessor.Result.class);
            then(batchService).should().complete(anyLong(), result.capture(), anySet(), any(), anyList(), anyInt(), anyInt());
            assertThat(result.getValue().items()).hasSize(4);
        }

        @Test
        @DisplayName("모든 계정이 실패하면 회차를 실패로 남기고, 원인과 함께 지금까지의 사용량을 저장한다")
        void failsWhenNoAccountCollected() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt()))
                    .willThrow(new XaiGrokClient.CallException("HTTP 401"));

            service().collect(TOPIC, RUN);

            ArgumentCaptor<List<String>> warnings = ArgumentCaptor.captor();
            ArgumentCaptor<GrokUsage> usage = ArgumentCaptor.forClass(GrokUsage.class);
            then(batchService).should().fail(eq(7L), usage.capture(), warnings.capture());
            assertThat(warnings.getValue()).contains("HTTP 401").last().isEqualTo("모든 계정의 수집에 실패함");
            assertThat(usage.getValue().calls()).isEqualTo(PLANNED_CALLS);
            then(batchService).should(never()).complete(anyLong(), any(), anySet(), any(), anyList(), anyInt(), anyInt());
        }

        @Test
        @DisplayName("수집 중 예상하지 못한 예외가 나도 회차를 실패로 바꿔 다음 수집을 막지 않는다")
        void failsOnUnexpectedException() {
            given(grokClient.respond(any(), anyString(), anyString(), anyInt())).willReturn(response(15, "입고"));
            willThrow(new IllegalStateException("db down"))
                    .given(batchService).complete(anyLong(), any(), anySet(), any(), anyList(), anyInt(), anyInt());

            service().collect(TOPIC, RUN);

            ArgumentCaptor<List<String>> warnings = ArgumentCaptor.captor();
            then(batchService).should().fail(eq(7L), any(), warnings.capture());
            assertThat(warnings.getValue()).last().isEqualTo("수집 중 예외: IllegalStateException");
        }
    }

    @Nested
    @DisplayName("상한")
    class Limits {

        @Test
        @DisplayName("비용 상한에 닿으면 남은 호출을 하지 않고, 아직 호출하지 못한 계정은 수집하지 못한 것으로 남긴다")
        void stopsAtCostLimit() {
            properties = NewsFixtures.properties(false, "", 40, 0.6);
            // 호출 하나가 $0.15 라서 치이카와샵 4번에서 $0.60 에 닿는다
            given(grokClient.respond(any(), anyString(), anyString(), anyInt()))
                    .willReturn(response(1_500_000_000L, "입고", 15));

            service().collect(TOPIC, RUN);

            then(grokClient).should(times(4)).respond(any(), anyString(), anyString(), anyInt());
            assertThat(capturedHandles()).containsExactly(SHOP);
            assertThat(capturedWarnings()).filteredOn(warning -> warning.startsWith("비용 상한($0.60)에 닿아"))
                    .hasSize(1);
        }

        @Test
        @DisplayName("재시도를 포함한 호출 수가 상한에 닿으면 남은 호출을 하지 않는다")
        void stopsAtCallLimitIncludingRetries() {
            properties = NewsFixtures.properties(false, "", 3, 0.6);
            given(grokClient.respond(any(), anyString(), anyString(), anyInt()))
                    .willThrow(new XaiGrokClient.CallException("HTTP 503", true, null, false));

            service().collect(TOPIC, RUN);

            then(grokClient).should(times(3)).respond(any(), anyString(), anyString(), anyInt());
            ArgumentCaptor<List<String>> warnings = ArgumentCaptor.captor();
            then(batchService).should().fail(eq(7L), any(), warnings.capture());
            assertThat(warnings.getValue()).filteredOn(warning -> warning.startsWith("호출 상한(3회, 재시도 포함)")).hasSize(1);
        }
    }

    @Nested
    @DisplayName("수집하지 않는 경우")
    class Skipped {

        @Test
        @DisplayName("이미 수집 중인 회차가 있으면 호출하지 않고 건너뜀으로 알린다")
        void skipsWhenAlreadyCollecting() {
            given(batchService.begin(eq(TOPIC), eq(RUN), anyList(), any(), any())).willReturn(Optional.empty());

            NewsRunResult result = service().collect(TOPIC, RUN);

            assertThat(result).isEqualTo(new NewsRunResult.Skipped(TOPIC, RUN, "이미 수집 중인 회차가 있음"));
            then(grokClient).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("다른 곳에서 동시에 회차를 시작했으면 (진행 중 회차 유니크 제약) 건너뜀으로 알린다")
        void skipsOnConcurrentStart() {
            given(batchService.begin(eq(TOPIC), eq(RUN), anyList(), any(), any()))
                    .willThrow(new DataIntegrityViolationException("uk_news_batch_active"));

            assertThat(service().collect(TOPIC, RUN)).isInstanceOf(NewsRunResult.Skipped.class);
            then(grokClient).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("설정에 없는 주제는 수집할 수 없다")
        void rejectsUnknownTopic() {
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> service().collect("UNKNOWN", RUN))
                    .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("UNKNOWN");
        }
    }

    private NewsCollectService service() {
        return new NewsCollectService(batchService, grokClient, new GrokResponseParser(objectMapper),
                new NewsPromptRenderer(), new NewsPostProcessor(), new CollectionPlanner(7, 14), backoff, properties, clock);
    }

    private Started started() {
        return new Started(7L, TOPIC, RUN, List.of(NewsFixtures.KR_SHOP, NewsFixtures.JP_KOUHOU), List.of(
                CollectPeriod.notCollected(SHOP, FROM, TODAY), CollectPeriod.notCollected(KOUHOU, FROM, TODAY)), null);
    }

    private NewsRunResult.Finished finished() {
        NewsBatch batch = NewsBatch.start(TOPIC, RUN, started().periods(), false, "chiikawa-v2");
        ReflectionTestUtils.setField(batch, "id", 7L);
        return new NewsRunResult.Finished(batch, List.of(), null);
    }

    private Set<String> capturedHandles() {
        ArgumentCaptor<Set<String>> handles = ArgumentCaptor.captor();
        then(batchService).should().complete(anyLong(), any(), handles.capture(), any(), anyList(), anyInt(), anyInt());
        return handles.getValue();
    }

    private GrokUsage capturedUsage() {
        ArgumentCaptor<GrokUsage> usage = ArgumentCaptor.forClass(GrokUsage.class);
        then(batchService).should().complete(anyLong(), any(), anySet(), usage.capture(), anyList(), anyInt(), anyInt());
        return usage.getValue();
    }

    private List<String> capturedWarnings() {
        ArgumentCaptor<List<String>> warnings = ArgumentCaptor.captor();
        then(batchService).should().complete(anyLong(), any(), anySet(), any(), warnings.capture(), anyInt(), anyInt());
        return warnings.getValue();
    }

    private String response(final int postsFetched, final String title) {
        return response(0L, title, postsFetched);
    }

    /**
     * 링크가 호출마다 다른 소식 하나와 사용량을 담은 xAI 응답.
     */
    private String response(final long costTicks, final String title, final int postsFetched) {
        String link = "https://x.com/chiikawashop_kr/status/" + Math.abs((long) title.hashCode() * 31 + postsFetched + costTicks);
        ObjectNode response = objectMapper.createObjectNode();
        response.putArray("output").addObject().put("type", "message").putArray("content").addObject()
                .put("type", "output_text").put("text", """
                        {"items": [{"section": "korea_store", "kind": "release", "title": "%s", "link": "%s"}]}
                        """.formatted(title, link));
        response.putArray("citations").add(link);
        ObjectNode usage = response.putObject("usage");
        usage.put("cost_in_usd_ticks", costTicks);
        usage.putObject("server_side_tool_usage_details").put("x_posts_fetched", postsFetched);
        return response.toString();
    }
}
