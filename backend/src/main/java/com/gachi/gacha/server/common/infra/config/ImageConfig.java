package com.gachi.gacha.server.common.infra.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.http.apache.ApacheHttpClient.Builder;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class ImageConfig {

    @Value("${cloud.aws.region}")
    private String region;

    @Bean
    public S3Client s3Client() {
        Builder builder = ApacheHttpClient.builder()
                .socketTimeout(Duration.ofSeconds(100));

        return S3Client.builder()
                .region(Region.of(region))
                .httpClientBuilder(builder)
                .build();
    }
}
