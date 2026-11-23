package com.gachi.gacha.server.news.infra;

import java.time.Duration;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpHeaders;

/**
 * 외부 호출(Grok, 슬랙)의 재시도 규칙. 재시도는 2번까지, 기다리는 시간은 2초 → 4초로 늘린다(서버가 1대라 지터는 두지 않는다).
 * 서버가 {@code Retry-After} 로 더 오래 기다리라고 하면 따르되, 스레드를 오래 붙잡지 않도록 30초까지만 기다린다.
 *
 * <p>기다리는 일을 이 클래스에 모아서, 테스트에서는 실제로 기다리지 않게 바꿀 수 있다.
 */
public class RetryBackoff {

    public static final int MAX_RETRIES = 2;

    private static final Duration BASE_DELAY = Duration.ofSeconds(2);
    private static final Duration MAX_RETRY_AFTER = Duration.ofSeconds(30);

    /**
     * @param retryNumber 몇 번째 재시도인지 (1부터)
     * @param retryAfter  서버가 알려준 대기 시간. 없으면 null
     */
    public Duration delay(final int retryNumber, @Nullable final Duration retryAfter) {
        Duration backoff = BASE_DELAY.multipliedBy(1L << (retryNumber - 1));
        if (retryAfter == null) {
            return backoff;
        }
        Duration capped = retryAfter.compareTo(MAX_RETRY_AFTER) > 0 ? MAX_RETRY_AFTER : retryAfter;
        return capped.compareTo(backoff) > 0 ? capped : backoff;
    }

    public void await(final Duration delay) {
        try {
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Retry-After 헤더(초 단위 숫자)를 읽는다. 날짜 형식이나 잘못된 값은 무시한다.
     */
    public static @Nullable Duration retryAfter(@Nullable final HttpHeaders headers) {
        String value = headers == null ? null : headers.getFirst(HttpHeaders.RETRY_AFTER);
        if (value == null) {
            return null;
        }
        try {
            long seconds = Long.parseLong(value.strip());
            return seconds < 0 ? null : Duration.ofSeconds(seconds);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
