package com.gachi.gacha.server.common.config;

import com.gachi.gacha.server.chat.presentation.websocket.StompDestinationInterceptor;
import com.gachi.gacha.server.common.auth.websocket.StompAuthInterceptor;
import com.gachi.gacha.server.common.exception.StompErrorHandler;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer, DisposableBean {

    private static final long HEARTBEAT_INTERVAL_MILLIS = 10_000L;
    private static final int HEARTBEAT_POOL_SIZE = 1;
    private static final String HEARTBEAT_THREAD_NAME_PREFIX = "stomp-heartbeat-";

    private final CorsProperty corsProperty;
    private final StompAuthInterceptor stompAuthInterceptor;
    private final StompDestinationInterceptor stompDestinationInterceptor;
    private final StompErrorHandler stompErrorHandler;

    @Nullable
    private ThreadPoolTaskScheduler heartbeatScheduler;

    @Override
    public void registerStompEndpoints(final StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        corsProperty.allowedOriginPatternsAsArray()
                );
        registry.setErrorHandler(stompErrorHandler);
    }

    @Override
    public void configureMessageBroker(final MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{HEARTBEAT_INTERVAL_MILLIS, HEARTBEAT_INTERVAL_MILLIS})
                .setTaskScheduler(createHeartbeatScheduler());
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(final ChannelRegistration registration) {
        registration.interceptors(stompAuthInterceptor, stompDestinationInterceptor);
    }

    @Override
    public void destroy() {
        if (heartbeatScheduler != null) {
            heartbeatScheduler.shutdown();
        }
    }

    /**
     * heart-beat 전용 스케줄러는 Bean으로 등록하지 않는다.
     * ThreadPoolTaskScheduler는 Executor 타입이라 Bean으로 노출되는 순간
     * Spring Boot의 applicationTaskExecutor 자동 구성이 backoff 되어
     * @Async 작업이 이 스레드 1개짜리 풀을 공유하게 된다.
     */
    private TaskScheduler createHeartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(HEARTBEAT_POOL_SIZE);
        scheduler.setThreadNamePrefix(HEARTBEAT_THREAD_NAME_PREFIX);
        scheduler.setDaemon(true);
        scheduler.initialize();
        heartbeatScheduler = scheduler;
        return scheduler;
    }
}
