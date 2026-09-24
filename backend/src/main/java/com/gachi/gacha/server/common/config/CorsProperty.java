package com.gachi.gacha.server.common.config;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "cors")
public record CorsProperty(
        @NotEmpty List<String> allowedOriginPatterns
) {
    public String[] allowedOriginPatternsAsArray() {
        return allowedOriginPatterns.toArray(String[]::new);
    }
}
