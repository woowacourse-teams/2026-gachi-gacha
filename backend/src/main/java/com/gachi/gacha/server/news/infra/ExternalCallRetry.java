package com.gachi.gacha.server.news.infra;

import java.time.Duration;
import java.util.function.Consumer;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.core.retry.RetryListener;
import org.springframework.core.retry.RetryPolicy;
import org.springframework.core.retry.RetryState;
import org.springframework.core.retry.RetryTemplate;
import org.springframework.core.retry.Retryable;
import org.springframework.http.HttpHeaders;
import org.springframework.util.backoff.ExponentialBackOff;

/**
 * 외부 호출(Grok, 슬랙)의 재시도 정책. 재시도 횟수, 대기 시간 증가, 재시도할 오류 구분은 스프링의
 * {@link RetryTemplate} 과 {@link ExponentialBackOff} 에 맡기고, 여기서는 정책 값과 {@code Retry-After} 반영만 정한다.
 *
 * <ul>
 *   <li>재시도는 2번까지, 대기는 2초 → 4초로 늘린다. 서버가 1대라 지터는 두지 않는다.</li>
 *   <li>{@link ExternalCallFailure#isRetryable()} 인 오류만 다시 시도한다. 그 밖의 오류는 바로 던진다.</li>
 *   <li>서버가 {@code Retry-After} 로 더 오래 기다리라고 하면 따르되, 스레드를 오래 붙잡지 않도록 30초까지만 기다린다.
 *       스프링 정책은 서버가 알려 준 시간을 받을 수 없어서, 백오프로 기다린 뒤 모자란 만큼만 더 기다린다.</li>
 * </ul>
 *
 * <p>{@link RetryTemplate#invoke} 는 재시도를 모두 쓰고도 실패하면 마지막 오류를 그대로 던져서, 호출하는 쪽의 예외 처리는 바뀌지 않는다.
 */
@Slf4j
public final class ExternalCallRetry {

    public static final int MAX_RETRIES = 2;

    private static final Duration BASE_DELAY = Duration.ofSeconds(2);
    private static final double MULTIPLIER = 2.0;
    private static final Duration MAX_RETRY_AFTER = Duration.ofSeconds(30);

    private ExternalCallRetry() {
    }

    public static RetryTemplate template() {
        return template(BASE_DELAY, ExternalCallRetry::sleep);
    }

    /**
     * 테스트에서 실제로 오래 기다리지 않도록 첫 대기 시간과 {@code Retry-After} 로 더 기다리는 방법을 바꿀 수 있다.
     *
     * @param extraWait {@code Retry-After} 때문에 백오프 뒤에 더 기다릴 때 호출한다
     */
    public static RetryTemplate template(final Duration baseDelay, final Consumer<Duration> extraWait) {
        ExponentialBackOff backOff = new ExponentialBackOff(baseDelay.toMillis(), MULTIPLIER);
        backOff.setMaxAttempts(MAX_RETRIES);
        RetryTemplate template = new RetryTemplate(RetryPolicy.builder()
                .backOff(backOff)
                .predicate(error -> error instanceof ExternalCallFailure failure && failure.isRetryable())
                .build());
        template.setRetryListener(new RetryListener() {
            @Override
            public void beforeRetry(final RetryPolicy policy, final Retryable<?> retryable, final RetryState state) {
                Throwable last = state.getLastException();
                log.warn("{} — 다시 시도 ({}/{}회)", last.getMessage(), state.getRetryCount(), MAX_RETRIES);
                if (last instanceof ExternalCallFailure failure && failure.retryAfter() != null) {
                    Duration waited = baseDelay.multipliedBy(1L << (state.getRetryCount() - 1));
                    Duration wanted = min(failure.retryAfter(), MAX_RETRY_AFTER);
                    if (wanted.compareTo(waited) > 0) {
                        extraWait.accept(wanted.minus(waited));
                    }
                }
            }
        });
        return template;
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

    private static Duration min(final Duration first, final Duration second) {
        return first.compareTo(second) > 0 ? second : first;
    }

    private static void sleep(final Duration delay) {
        try {
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
