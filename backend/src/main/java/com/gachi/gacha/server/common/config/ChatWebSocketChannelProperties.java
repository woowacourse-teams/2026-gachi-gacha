package com.gachi.gacha.server.common.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "chat.websocket")
public record ChatWebSocketChannelProperties(
        @Valid ExecutorProperties inbound,
        @Valid ExecutorProperties outbound
) {

    public record ExecutorProperties(
            @Min(1) int corePoolSize,
            @Min(1) int maxPoolSize,
            @Min(0) int queueCapacity
    ) {
        public ExecutorProperties {
            if (maxPoolSize < corePoolSize) {
                throw new IllegalArgumentException("maxPoolSize must be greater than or equal to corePoolSize");
            }
        }
    }
}
