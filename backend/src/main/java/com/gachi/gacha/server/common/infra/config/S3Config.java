package com.gachi.gacha.server.common.infra.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.core.retry.RetryPolicy;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.http.apache.ApacheHttpClient.Builder;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class S3Config {

    private static final Duration SOCKET_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration API_CALL_TIMEOUT = Duration.ofSeconds(60);
    private static final int MAX_RETRIES = 2;

    @Value("${cloud.aws.region}")
    private String region;

    @Bean
    public S3Client s3Client() {
        Builder builder = ApacheHttpClient.builder()
                .socketTimeout(SOCKET_TIMEOUT);

        return S3Client.builder()
                .region(Region.of(region))
                .httpClientBuilder(builder)
                .overrideConfiguration(config-> config
                        .apiCallTimeout(API_CALL_TIMEOUT)
                        .retryPolicy(RetryPolicy.builder()
                                .numRetries(MAX_RETRIES)
                                .build()))
                .build();
    }
}
