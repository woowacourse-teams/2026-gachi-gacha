package com.gachi.gacha.server.notification.infra;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 알림 저장과 FCM 발송 전용 스레드 풀. FCM 이 느려져도 다른 비동기 작업이 밀리지 않게 분리한다.
 *
 * <p>스레드는 큐가 가득 찬 뒤에야 코어 수를 넘겨 늘어나므로, 큐가 큰 지금 구조에서는 코어와 최대 수를 같게 둔다.
 *
 * <p>큐가 가득 차면 알림을 버리고 로그를 남긴다. 알림은 댓글 작성보다 덜 중요하므로 요청 스레드로 넘기지 않는다.
 */
@Slf4j
@Configuration
public class NotificationExecutorConfig {

    public static final String EXECUTOR_NAME = "notificationExecutor";

    private static final int POOL_SIZE = 4;
    private static final int QUEUE_CAPACITY = 500;
    private static final int AWAIT_TERMINATION_SECONDS = 10;

    @Bean(name = EXECUTOR_NAME)
    public ThreadPoolTaskExecutor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(POOL_SIZE);
        executor.setMaxPoolSize(POOL_SIZE);
        executor.setQueueCapacity(QUEUE_CAPACITY);
        executor.setThreadNamePrefix("notification-");
        executor.setRejectedExecutionHandler((task, pool) ->
                log.error("알림 작업 대기열이 가득 차 작업을 버립니다. queueSize = {}", pool.getQueue().size()));
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(AWAIT_TERMINATION_SECONDS);
        return executor;
    }
}
