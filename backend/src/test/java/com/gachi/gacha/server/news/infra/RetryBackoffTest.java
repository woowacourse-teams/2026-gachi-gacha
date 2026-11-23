package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

class RetryBackoffTest {

    private final RetryBackoff backoff = new RetryBackoff();

    @Test
    @DisplayName("재시도는 2번까지, 기다리는 시간은 2초 → 4초로 늘어난다")
    void exponentialBackoff() {
        assertThat(RetryBackoff.MAX_RETRIES).isEqualTo(2);
        assertThat(backoff.delay(1, null)).isEqualTo(Duration.ofSeconds(2));
        assertThat(backoff.delay(2, null)).isEqualTo(Duration.ofSeconds(4));
    }

    @Test
    @DisplayName("서버가 더 오래 기다리라고 하면 따르되 30초를 넘기지 않고, 더 짧으면 기본 대기를 쓴다")
    void followsRetryAfterWithinLimit() {
        assertThat(backoff.delay(1, Duration.ofSeconds(10))).isEqualTo(Duration.ofSeconds(10));
        assertThat(backoff.delay(1, Duration.ofSeconds(120))).isEqualTo(Duration.ofSeconds(30));
        assertThat(backoff.delay(2, Duration.ofSeconds(1))).isEqualTo(Duration.ofSeconds(4));
    }

    @Test
    @DisplayName("Retry-After 는 초 단위 숫자만 읽고, 날짜 형식·음수·잘못된 값은 무시한다")
    void parsesRetryAfterHeader() {
        assertThat(RetryBackoff.retryAfter(header("7"))).isEqualTo(Duration.ofSeconds(7));
        assertThat(RetryBackoff.retryAfter(header("Wed, 21 Oct 2026 07:28:00 GMT"))).isNull();
        assertThat(RetryBackoff.retryAfter(header("-3"))).isNull();
        assertThat(RetryBackoff.retryAfter(header("abc"))).isNull();
        assertThat(RetryBackoff.retryAfter(new HttpHeaders())).isNull();
        assertThat(RetryBackoff.retryAfter(null)).isNull();
    }

    private HttpHeaders header(final String retryAfter) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, retryAfter);
        return headers;
    }
}
