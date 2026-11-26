package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.retry.RetryTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.util.backoff.BackOffExecution;

class ExternalCallRetryTest {

    private static final Duration BASE_DELAY = Duration.ofMillis(1);

    private final List<Duration> extraWaits = new ArrayList<>();
    private final RetryTemplate template = ExternalCallRetry.template(BASE_DELAY, extraWaits::add);

    @Test
    @DisplayName("운영 정책은 재시도 2번까지, 기다리는 시간은 2초 → 4초로 늘어나고 그 뒤에는 멈춘다")
    void productionPolicyIsExponentialWithTwoRetries() {
        BackOffExecution execution = ExternalCallRetry.template().getRetryPolicy().getBackOff().start();

        assertThat(ExternalCallRetry.MAX_RETRIES).isEqualTo(2);
        assertThat(execution.nextBackOff()).isEqualTo(2_000);
        assertThat(execution.nextBackOff()).isEqualTo(4_000);
        assertThat(execution.nextBackOff()).isEqualTo(BackOffExecution.STOP);
    }

    @Test
    @DisplayName("다시 해 볼 만한 오류는 2번까지 다시 시도하고, 모두 실패하면 마지막 오류를 그대로 던진다")
    void retriesTwiceThenThrowsLastError() {
        AtomicInteger calls = new AtomicInteger();

        assertThatThrownBy(() -> template.invoke(() -> {
            throw new Failure("실패 " + calls.incrementAndGet(), true, null);
        })).isInstanceOf(Failure.class).hasMessage("실패 3");

        assertThat(calls).hasValue(3);
    }

    @Test
    @DisplayName("중간에 성공하면 거기서 멈추고 결과를 돌려준다")
    void stopsOnSuccess() {
        AtomicInteger calls = new AtomicInteger();

        String result = template.invoke(() -> {
            if (calls.incrementAndGet() < 2) {
                throw new Failure("일시 오류", true, null);
            }
            return "ok";
        });

        assertThat(result).isEqualTo("ok");
        assertThat(calls).hasValue(2);
    }

    @Test
    @DisplayName("다시 해도 같은 오류(4xx, ok:false)와 외부 호출 오류가 아닌 예외는 다시 시도하지 않는다")
    void doesNotRetryPermanentOrUnknownErrors() {
        AtomicInteger permanent = new AtomicInteger();
        AtomicInteger unknown = new AtomicInteger();

        assertThatThrownBy(() -> template.invoke(() -> {
            permanent.incrementAndGet();
            throw new Failure("HTTP 400", false, null);
        })).isInstanceOf(Failure.class);
        assertThatThrownBy(() -> template.invoke(() -> {
            unknown.incrementAndGet();
            throw new IllegalStateException("버그");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(permanent).hasValue(1);
        assertThat(unknown).hasValue(1);
        assertThat(extraWaits).isEmpty();
    }

    @Test
    @DisplayName("Retry-After 가 백오프보다 길면 모자란 만큼만 더 기다리고, 30초를 넘기지 않으며, 더 짧으면 더 기다리지 않는다")
    void followsRetryAfterWithinLimit() {
        AtomicInteger calls = new AtomicInteger();
        List<Duration> retryAfters = List.of(Duration.ofSeconds(10), Duration.ofSeconds(120));

        assertThatThrownBy(() -> template.invoke(() -> {
            throw new Failure("429", true, retryAfters.get(Math.min(calls.getAndIncrement(), 1)));
        })).isInstanceOf(Failure.class);

        // 1번째 재시도는 백오프 1ms, 2번째는 2ms 를 이미 기다린 뒤라서 그만큼 뺀다
        assertThat(extraWaits).containsExactly(Duration.ofSeconds(10).minus(BASE_DELAY), Duration.ofSeconds(30).minus(BASE_DELAY.multipliedBy(2)));

        extraWaits.clear();
        assertThatThrownBy(() -> ExternalCallRetry.template(Duration.ofMillis(20), extraWaits::add).invoke(() -> {
            throw new Failure("429", true, Duration.ofMillis(5));
        })).isInstanceOf(Failure.class);
        // 서버가 5ms 만 기다리라고 했으니 백오프(20ms, 40ms)로 충분하다. 더 기다리지 않는다
        assertThat(extraWaits).isEmpty();
    }

    @Test
    @DisplayName("Retry-After 는 초 단위 숫자만 읽고, 날짜 형식·음수·잘못된 값은 무시한다")
    void parsesRetryAfterHeader() {
        assertThat(ExternalCallRetry.retryAfter(header("7"))).isEqualTo(Duration.ofSeconds(7));
        assertThat(ExternalCallRetry.retryAfter(header("Wed, 21 Oct 2026 07:28:00 GMT"))).isNull();
        assertThat(ExternalCallRetry.retryAfter(header("-3"))).isNull();
        assertThat(ExternalCallRetry.retryAfter(header("abc"))).isNull();
        assertThat(ExternalCallRetry.retryAfter(new HttpHeaders())).isNull();
        assertThat(ExternalCallRetry.retryAfter(null)).isNull();
    }

    private HttpHeaders header(final String retryAfter) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, retryAfter);
        return headers;
    }

    private static final class Failure extends RuntimeException implements ExternalCallFailure {

        private final boolean retryable;
        private final @Nullable Duration retryAfter;

        private Failure(final String message, final boolean retryable, @Nullable final Duration retryAfter) {
            super(message);
            this.retryable = retryable;
            this.retryAfter = retryAfter;
        }

        @Override
        public boolean isRetryable() {
            return retryable;
        }

        @Override
        public @Nullable Duration retryAfter() {
            return retryAfter;
        }
    }
}
