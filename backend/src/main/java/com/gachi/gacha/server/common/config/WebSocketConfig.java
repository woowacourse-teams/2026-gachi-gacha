package com.gachi.gacha.server.common.config;

import com.gachi.gacha.server.chat.presentation.websocket.StompDestinationInterceptor;
import com.gachi.gacha.server.common.auth.websocket.StompAuthInterceptor;
import com.gachi.gacha.server.common.exception.StompErrorHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final CorsProperty corsProperty;
    private final StompAuthInterceptor stompAuthInterceptor;
    private final StompDestinationInterceptor stompDestinationInterceptor;
    private final ThreadPoolTaskScheduler stompHeartbeatScheduler;
    private final StompErrorHandler stompErrorHandler;

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
                .setHeartbeatValue(new long[]{10_000, 10_000})
                .setTaskScheduler(stompHeartbeatScheduler);
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(final ChannelRegistration registration) {
        registration.interceptors(stompAuthInterceptor, stompDestinationInterceptor);
    }
}
