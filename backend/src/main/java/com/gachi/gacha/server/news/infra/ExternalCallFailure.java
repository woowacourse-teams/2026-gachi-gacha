package com.gachi.gacha.server.news.infra;

import java.time.Duration;
import org.jspecify.annotations.Nullable;

/**
 * 외부 호출(Grok, 슬랙)이 실패했을 때, 다시 시도해 볼 만한지와 서버가 알려 준 대기 시간을 담는 오류.
 * {@link ExternalCallRetry} 가 이 값으로 재시도 여부를 정한다.
 */
public interface ExternalCallFailure {

    /**
     * 타임아웃, 429, 5xx 처럼 다시 해 볼 만한 실패인지. 4xx(429 제외)나 슬랙의 ok:false 응답은 다시 해도 같아서 false 다.
     */
    boolean isRetryable();

    /**
     * 서버가 {@code Retry-After} 로 알려 준 대기 시간. 없으면 null
     */
    @Nullable Duration retryAfter();
}
